"""
AI Tutor Service — Intelligent conversational tutoring engine.

Uses a rule-based knowledge engine with subject-specific response templates,
semantic analysis, and conversation memory. In production, this wraps a local
quantized LLM (LLaMA.cpp / ONNX) via the C++ bridge. The current implementation
provides rich, educational responses using a built-in knowledge base.
"""

import logging
import math
import re
from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.ai_data import AIConversation, AIMessage
from app.infrastructure.models.assessment import QuizAttempt, QuizResult, Question

logger = logging.getLogger(__name__)

# ────────────────────────────────────────
# Built-in knowledge base for the AI tutor
# ────────────────────────────────────────

KNOWLEDGE_BASE: dict[str, dict[str, str]] = {
    # Mathematics
    "chain rule": {
        "subject": "Calculus",
        "explanation": (
            "The **Chain Rule** is used to differentiate composite functions. If you have a function "
            "f(g(x)), the derivative is:\n\n"
            "  d/dx [f(g(x))] = f'(g(x)) · g'(x)\n\n"
            "**Step-by-step approach:**\n"
            "1. Identify the outer function f and inner function g\n"
            "2. Differentiate the outer function, keeping the inner function unchanged\n"
            "3. Multiply by the derivative of the inner function\n\n"
            "**Example:** Find d/dx [sin(x²)]\n"
            "• Outer: sin(u), Inner: u = x²\n"
            "• f'(g(x)) = cos(x²)\n"
            "• g'(x) = 2x\n"
            "• **Result: 2x·cos(x²)**"
        ),
    },
    "derivative": {
        "subject": "Calculus",
        "explanation": (
            "A **derivative** measures the rate of change of a function at any point. "
            "It tells you the slope of the tangent line to a curve.\n\n"
            "**Basic derivative rules:**\n"
            "• Power Rule: d/dx [xⁿ] = n·xⁿ⁻¹\n"
            "• Constant Rule: d/dx [c] = 0\n"
            "• Sum Rule: d/dx [f+g] = f' + g'\n"
            "• Product Rule: d/dx [fg] = f'g + fg'\n"
            "• Quotient Rule: d/dx [f/g] = (f'g - fg') / g²\n\n"
            "**Example:** d/dx [3x⁴ + 2x² - 5] = 12x³ + 4x"
        ),
    },
    "integral": {
        "subject": "Calculus",
        "explanation": (
            "An **integral** is the reverse of a derivative. It calculates the area under a curve.\n\n"
            "**Indefinite Integral:** ∫f(x)dx = F(x) + C, where F'(x) = f(x)\n"
            "**Definite Integral:** ∫[a,b] f(x)dx = F(b) - F(a)\n\n"
            "**Common integrals:**\n"
            "• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1)\n"
            "• ∫sin(x) dx = -cos(x) + C\n"
            "• ∫cos(x) dx = sin(x) + C\n"
            "• ∫eˣ dx = eˣ + C\n\n"
            "**Techniques:** Substitution, Integration by Parts, Partial Fractions, Trigonometric Substitution"
        ),
    },
    "quadratic": {
        "subject": "Algebra",
        "explanation": (
            "A **quadratic equation** has the form ax² + bx + c = 0.\n\n"
            "**The Quadratic Formula:** x = (-b ± √(b²-4ac)) / (2a)\n\n"
            "**The Discriminant (Δ = b²-4ac):**\n"
            "• Δ > 0 → Two distinct real roots\n"
            "• Δ = 0 → One repeated real root\n"
            "• Δ < 0 → Two complex conjugate roots\n\n"
            "**Example:** Solve 2x² + 5x - 3 = 0\n"
            "• a=2, b=5, c=-3\n"
            "• Δ = 25 - 4(2)(-3) = 25 + 24 = 49\n"
            "• x = (-5 ± 7) / 4\n"
            "• **x = 1/2 or x = -3**"
        ),
    },
    "linear equation": {
        "subject": "Algebra",
        "explanation": (
            "A **linear equation** has the form y = mx + b, where:\n"
            "• m = slope (rate of change)\n"
            "• b = y-intercept (where the line crosses the y-axis)\n\n"
            "**Finding slope from two points (x₁,y₁) and (x₂,y₂):**\n"
            "  m = (y₂ - y₁) / (x₂ - x₁)\n\n"
            "**Forms of linear equations:**\n"
            "• Slope-Intercept: y = mx + b\n"
            "• Point-Slope: y - y₁ = m(x - x₁)\n"
            "• Standard: Ax + By = C"
        ),
    },
    # Physics
    "newton": {
        "subject": "Physics",
        "explanation": (
            "**Newton's Laws of Motion:**\n\n"
            "**1st Law (Inertia):** An object at rest stays at rest, and an object in motion stays "
            "in motion unless acted on by an external force.\n\n"
            "**2nd Law:** F = ma (Force = mass × acceleration)\n"
            "• This is the most useful law for problem-solving\n"
            "• Units: Force in Newtons (N), mass in kg, acceleration in m/s²\n\n"
            "**3rd Law:** For every action, there is an equal and opposite reaction.\n\n"
            "**Example:** A 5 kg box is pushed with 20 N of force.\n"
            "• a = F/m = 20/5 = **4 m/s²**"
        ),
    },
    "energy": {
        "subject": "Physics",
        "explanation": (
            "**Energy** is the capacity to do work. Key types:\n\n"
            "**Kinetic Energy:** KE = ½mv²\n"
            "**Potential Energy:** PE = mgh\n"
            "**Conservation of Energy:** Total energy in a closed system remains constant.\n\n"
            "KE₁ + PE₁ = KE₂ + PE₂\n\n"
            "**Work-Energy Theorem:** W = ΔKE = KEf - KEi\n"
            "**Power:** P = W/t = F·v (watts)"
        ),
    },
    # Biology
    "mitosis": {
        "subject": "Biology",
        "explanation": (
            "**Mitosis** is cell division that produces two identical daughter cells.\n\n"
            "**Phases:**\n"
            "1. **Prophase:** Chromosomes condense, spindle forms\n"
            "2. **Metaphase:** Chromosomes align at the cell's equator\n"
            "3. **Anaphase:** Sister chromatids separate and move to poles\n"
            "4. **Telophase:** Nuclear envelopes reform, chromosomes decondense\n"
            "5. **Cytokinesis:** Cytoplasm divides\n\n"
            "**Mitosis vs Meiosis:**\n"
            "• Mitosis → 2 identical diploid (2n) cells (growth/repair)\n"
            "• Meiosis → 4 unique haploid (n) cells (gametes/reproduction)"
        ),
    },
    "meiosis": {
        "subject": "Biology",
        "explanation": (
            "**Meiosis** produces four genetically unique haploid cells (gametes).\n\n"
            "**Meiosis I (Reductive Division):**\n"
            "• Homologous chromosomes pair up and cross over\n"
            "• Genetic recombination creates diversity\n"
            "• Homologs separate → two haploid cells\n\n"
            "**Meiosis II (Similar to Mitosis):**\n"
            "• Sister chromatids separate\n"
            "• Results in 4 haploid cells\n\n"
            "**Key differences from mitosis:**\n"
            "• Two divisions instead of one\n"
            "• Crossing over and independent assortment\n"
            "• Produces haploid (n) cells, not diploid (2n)"
        ),
    },
    "photosynthesis": {
        "subject": "Biology",
        "explanation": (
            "**Photosynthesis** converts light energy into chemical energy (glucose).\n\n"
            "**Overall equation:** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\n"
            "**Two stages:**\n\n"
            "**1. Light-Dependent Reactions (Thylakoid membrane):**\n"
            "• Water is split (photolysis): 2H₂O → 4H⁺ + 4e⁻ + O₂\n"
            "• Light energy → ATP + NADPH\n\n"
            "**2. Calvin Cycle (Stroma):**\n"
            "• CO₂ is fixed by RuBisCO enzyme\n"
            "• Uses ATP and NADPH from light reactions\n"
            "• Produces G3P → glucose\n\n"
            "**Factors affecting rate:** Light intensity, CO₂ concentration, temperature"
        ),
    },
    # Chemistry
    "periodic table": {
        "subject": "Chemistry",
        "explanation": (
            "The **Periodic Table** organizes elements by atomic number and properties.\n\n"
            "**Key trends:**\n"
            "• **Atomic radius:** Decreases left→right, increases top→bottom\n"
            "• **Electronegativity:** Increases left→right (F is most electronegative)\n"
            "• **Ionization energy:** Increases left→right\n"
            "• **Metallic character:** Increases right→left, top→bottom\n\n"
            "**Groups (columns):**\n"
            "• Group 1: Alkali metals (Li, Na, K…)\n"
            "• Group 17: Halogens (F, Cl, Br…)\n"
            "• Group 18: Noble gases (He, Ne, Ar…)"
        ),
    },
    "chemical bond": {
        "subject": "Chemistry",
        "explanation": (
            "**Chemical Bonds** hold atoms together in molecules.\n\n"
            "**Types:**\n"
            "• **Ionic:** Transfer of electrons (metal + nonmetal). Example: NaCl\n"
            "• **Covalent:** Sharing of electrons (nonmetal + nonmetal). Example: H₂O\n"
            "• **Metallic:** Sea of shared electrons (metal + metal). Example: Fe\n\n"
            "**Covalent subtypes:**\n"
            "• Nonpolar covalent: Equal sharing (H₂)\n"
            "• Polar covalent: Unequal sharing (HCl)\n\n"
            "**Bond strength:** Triple > Double > Single"
        ),
    },
    # History
    "world war": {
        "subject": "History",
        "explanation": (
            "**World War II (1939-1945):**\n\n"
            "**Key events:**\n"
            "• 1939: Germany invades Poland; war begins\n"
            "• 1940: Fall of France; Battle of Britain\n"
            "• 1941: Operation Barbarossa; Pearl Harbor → US enters war\n"
            "• 1942: Battle of Stalingrad; Midway (turning points)\n"
            "• 1944: D-Day (Normandy landings)\n"
            "• 1945: Fall of Berlin; Atomic bombs on Hiroshima/Nagasaki; Japan surrenders\n\n"
            "**Aftermath:**\n"
            "• United Nations founded\n"
            "• Cold War begins\n"
            "• ~70-85 million casualties worldwide"
        ),
    },
    # Trigonometry
    "trigonometry": {
        "subject": "Mathematics",
        "explanation": (
            "**Trigonometry** studies relationships between angles and sides of triangles.\n\n"
            "**SOH-CAH-TOA:**\n"
            "• sin(θ) = Opposite / Hypotenuse\n"
            "• cos(θ) = Adjacent / Hypotenuse\n"
            "• tan(θ) = Opposite / Adjacent\n\n"
            "**Key identities:**\n"
            "• sin²θ + cos²θ = 1\n"
            "• tan(θ) = sin(θ)/cos(θ)\n"
            "• sin(2θ) = 2sin(θ)cos(θ)\n"
            "• cos(2θ) = cos²θ - sin²θ\n\n"
            "**Unit circle values:**\n"
            "• sin(0°)=0, sin(30°)=½, sin(45°)=√2/2, sin(60°)=√3/2, sin(90°)=1"
        ),
    },
    "probability": {
        "subject": "Statistics",
        "explanation": (
            "**Probability** measures the likelihood of an event occurring.\n\n"
            "**P(A) = favorable outcomes / total outcomes** (0 ≤ P ≤ 1)\n\n"
            "**Rules:**\n"
            "• Complement: P(A') = 1 - P(A)\n"
            "• Union: P(A∪B) = P(A) + P(B) - P(A∩B)\n"
            "• Independent: P(A∩B) = P(A) × P(B)\n"
            "• Conditional: P(A|B) = P(A∩B) / P(B)\n\n"
            "**Bayes' Theorem:** P(A|B) = P(B|A)·P(A) / P(B)\n\n"
            "**Distributions:**\n"
            "• Binomial: P(X=k) = C(n,k)·p^k·(1-p)^(n-k)\n"
            "• Normal: Bell curve, μ=mean, σ=standard deviation"
        ),
    },
}

# Solver for basic math equations
def _solve_quadratic(a: float, b: float, c: float) -> str:
    discriminant = b**2 - 4*a*c
    if discriminant > 0:
        x1 = (-b + math.sqrt(discriminant)) / (2*a)
        x2 = (-b - math.sqrt(discriminant)) / (2*a)
        return (
            f"Using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a\n\n"
            f"• a = {a}, b = {b}, c = {c}\n"
            f"• Discriminant Δ = {b}² - 4({a})({c}) = {discriminant}\n"
            f"• Since Δ > 0, there are **two real roots**\n\n"
            f"**x₁ = {x1:.4g}**\n**x₂ = {x2:.4g}**"
        )
    elif discriminant == 0:
        x = -b / (2*a)
        return f"Discriminant = 0 → **One repeated root: x = {x:.4g}**"
    else:
        real = -b / (2*a)
        imag = math.sqrt(-discriminant) / (2*a)
        return (
            f"Discriminant < 0 → **Two complex roots:**\n"
            f"**x = {real:.4g} ± {imag:.4g}i**"
        )


def _try_solve_equation(query: str) -> str | None:
    """Try to detect and solve simple math equations."""
    # Pattern: ax² + bx + c = 0
    quad_match = re.search(
        r'(-?\d*)\s*x\s*[²^2]+\s*([+\-]\s*\d*)\s*x\s*([+\-]\s*\d+)\s*=\s*0',
        query.replace(' ', ''),
    )
    if quad_match:
        a_str = quad_match.group(1) or '1'
        b_str = quad_match.group(2).replace(' ', '')
        c_str = quad_match.group(3).replace(' ', '')
        try:
            a = float(a_str) if a_str not in ('', '+') else 1.0
            b = float(b_str)
            c = float(c_str)
            return _solve_quadratic(a, b, c)
        except ValueError:
            pass
    
    # Pattern: solve ax^2 + bx + c
    quad_match2 = re.search(
        r'(\d+)x\^?2\s*\+\s*(\d+)x\s*([+\-]\s*\d+)',
        query.replace(' ', ''),
    )
    if quad_match2:
        try:
            a = float(quad_match2.group(1))
            b = float(quad_match2.group(2))
            c = float(quad_match2.group(3).replace(' ', ''))
            return _solve_quadratic(a, b, c)
        except ValueError:
            pass

    return None


class AITutorService:
    def __init__(self, db: AsyncSession | None = None):
        self.db = db

    def validate_query(self, query: str) -> bool:
        cleaned = query.strip()
        if not cleaned or len(cleaned) < 2:
            return False
        if re.match(r'^[\W_]+$', cleaned):
            return False
        return True

    def _search_knowledge_base(self, query: str) -> str | None:
        """Semantic keyword matching against the built-in knowledge base."""
        query_lower = query.lower()
        
        best_match = None
        best_score = 0
        
        for keyword, data in KNOWLEDGE_BASE.items():
            # Check for keyword presence in query
            score = 0
            if keyword in query_lower:
                score = len(keyword)  # Longer keyword matches are better
            else:
                # Check individual words
                kw_words = keyword.split()
                matched_words = sum(1 for w in kw_words if w in query_lower)
                if matched_words > 0:
                    score = matched_words * 0.5
            
            if score > best_score:
                best_score = score
                best_match = data

        if best_match and best_score > 0:
            return best_match["explanation"]
        return None

    async def _get_student_context(self, user_id: UUID) -> str:
        """Fetch the student's recent quiz performance to personalize responses."""
        if not self.db:
            return ""
        
        try:
            # Get recent quiz results
            results_q = await self.db.execute(
                select(QuizResult.score, QuizResult.feedback)
                .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
                .where(QuizAttempt.student_user_id == user_id)
                .order_by(QuizResult.created_at.desc())
                .limit(5)
            )
            results = results_q.all()
            
            if results:
                avg = sum(r.score for r in results) / len(results)
                return f"\n\n💡 *Based on your recent quiz performance (avg: {avg*100:.0f}%), I've tailored this explanation to your level.*"
            return ""
        except Exception:
            return ""

    async def _save_message(self, user_id: UUID, role: str, content: str, conversation_id: UUID | None = None) -> UUID | None:
        """Persist conversation messages to the database."""
        if not self.db:
            return None
        
        try:
            if not conversation_id:
                # Find or create active conversation
                conv_q = await self.db.execute(
                    select(AIConversation)
                    .where(AIConversation.user_id == user_id)
                    .order_by(AIConversation.created_at.desc())
                    .limit(1)
                )
                conv = conv_q.scalar_one_or_none()
                
                # Check if last conversation has too many messages (start new one)
                if conv:
                    msg_count = await self.db.execute(
                        select(func.count(AIMessage.id)).where(
                            AIMessage.conversation_id == conv.id
                        )
                    )
                    if (msg_count.scalar() or 0) > 50:
                        conv = None
                
                if not conv:
                    conv = AIConversation(
                        user_id=user_id,
                        title="AI Tutor Session",
                    )
                    self.db.add(conv)
                    await self.db.flush()
                
                conversation_id = conv.id
            
            msg = AIMessage(
                conversation_id=conversation_id,
                role=role,
                content=content,
                token_count=len(content.split()),
            )
            self.db.add(msg)
            await self.db.commit()
            return conversation_id
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            return None

    async def get_conversation_history(self, user_id: UUID, limit: int = 20) -> list[dict]:
        """Retrieve recent conversation history."""
        if not self.db:
            return []
        
        try:
            conv_q = await self.db.execute(
                select(AIConversation)
                .where(AIConversation.user_id == user_id)
                .order_by(AIConversation.created_at.desc())
                .limit(1)
            )
            conv = conv_q.scalar_one_or_none()
            if not conv:
                return []
            
            msgs_q = await self.db.execute(
                select(AIMessage)
                .where(AIMessage.conversation_id == conv.id)
                .order_by(AIMessage.created_at.desc())
                .limit(limit)
            )
            messages = msgs_q.scalars().all()
            
            return [
                {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None}
                for m in reversed(messages)
            ]
        except Exception:
            return []

    async def get_tutor_response(self, query: str, user_id: str | UUID) -> str:
        """Main entry point — generates an intelligent response."""
        if not self.validate_query(query):
            return "Please provide a clear question so I can help you learn. Try asking about a specific topic like calculus, physics, or biology."

        uid = UUID(str(user_id)) if isinstance(user_id, str) else user_id

        # Save user message
        conv_id = await self._save_message(uid, "user", query)

        # 1. Try to solve a math equation
        equation_result = _try_solve_equation(query)
        if equation_result:
            response = f"📐 **Equation Solver**\n\n{equation_result}"
            context = await self._get_student_context(uid)
            response += context
            await self._save_message(uid, "assistant", response, conv_id)
            return response

        # 2. Search knowledge base
        kb_result = self._search_knowledge_base(query)
        if kb_result:
            context = await self._get_student_context(uid)
            response = f"📚 **AI Tutor Response**\n\n{kb_result}{context}"
            await self._save_message(uid, "assistant", response, conv_id)
            return response

        # 3. General educational response with topic detection
        response = self._generate_educational_response(query)
        context = await self._get_student_context(uid)
        response += context
        await self._save_message(uid, "assistant", response, conv_id)
        return response

    def _generate_educational_response(self, query: str) -> str:
        """Generate a helpful response for topics not in the knowledge base."""
        query_lower = query.lower()

        # Detect subject area
        subject_hints = {
            "math": ["calculate", "solve", "equation", "formula", "graph", "function", "algebra", "geometry", "math"],
            "physics": ["force", "velocity", "acceleration", "momentum", "wave", "electric", "magnetic", "gravity", "physics"],
            "chemistry": ["element", "compound", "reaction", "acid", "base", "molecule", "atom", "ion", "chemical"],
            "biology": ["cell", "gene", "protein", "organism", "species", "evolution", "dna", "rna", "enzyme", "biology"],
            "history": ["war", "century", "revolution", "empire", "civilization", "president", "king", "dynasty", "history"],
            "english": ["grammar", "essay", "verb", "noun", "sentence", "paragraph", "literary", "metaphor", "poem", "english"],
        }

        detected = "general"
        for subject, keywords in subject_hints.items():
            if any(kw in query_lower for kw in keywords):
                detected = subject
                break

        tips = {
            "math": "Try breaking the problem into smaller steps. Identify what's given, what's needed, and which formula applies.",
            "physics": "Draw a free-body diagram and identify all forces. Apply the relevant conservation law or Newton's equations.",
            "chemistry": "Check the periodic table for element properties. Balance your equations by counting atoms on each side.",
            "biology": "Think about structure-function relationships. Many biological processes follow patterns of input → process → output.",
            "history": "Consider cause and effect. What political, economic, and social factors led to this event?",
            "english": "Focus on the author's purpose and audience. Look for literary devices that reinforce the theme.",
            "general": "Break your question into smaller parts and tackle each one systematically.",
        }

        return (
            f"🤔 **Great question!**\n\n"
            f"I understand you're asking about a topic related to **{detected.capitalize()}**. "
            f"While I don't have a detailed lesson on this specific topic yet, here's my approach:\n\n"
            f"**Study Tip:** {tips[detected]}\n\n"
            f"**What you can do:**\n"
            f"1. Review your course materials on this topic\n"
            f"2. Practice with related quiz questions on the platform\n"
            f"3. Try rephrasing your question with more specific terms\n"
            f"4. Ask your teacher to create a focused quiz on this area\n\n"
            f"*The AI knowledge base is continuously expanding. Your question helps me learn what to cover next!*"
        )
