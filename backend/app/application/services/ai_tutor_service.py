"""
AI Tutor Service — RAG-powered conversational tutoring with Gemini.

Uses Google Gemini API with Retrieval-Augmented Generation (RAG):
1. Gathers student context (courses, quiz scores, weak topics) from the DB
2. Retrieves relevant knowledge base snippets
3. Includes conversation history for multi-turn dialogue
4. Sends everything to Gemini with a carefully crafted system prompt
5. Falls back to the built-in knowledge base if Gemini is unavailable
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
from app.infrastructure.models.academic import Course, Enrollment

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Gemini client (lazy-init singleton)
# ─────────────────────────────────────────────

_gemini_model = None


def _get_gemini_model():
    """Lazy-initialize the Gemini model. Returns None if API key is missing."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    from app.core.config import settings
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — AI Tutor will use fallback knowledge base only.")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_model = genai.GenerativeModel(settings.gemini_model)
        logger.info(f"Gemini model initialized: {settings.gemini_model}")
        return _gemini_model
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {e}")
        return None


# ─────────────────────────────────────────────
# System prompt for the AI tutor
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are **Nexus AI Tutor**, an expert educational assistant embedded in the Nexus LearnAI platform. You help students learn by providing clear, accurate, and engaging explanations.

## Your Personality
- Patient, encouraging, and supportive
- You break complex concepts into digestible steps
- You use analogies and real-world examples when helpful
- You celebrate the student's strengths and gently address weaknesses
- You speak directly to the student using "you"

## Rules
1. **Only answer educational/academic questions.** If someone asks something unrelated to learning (e.g., personal advice, coding a virus, political opinions), politely decline and redirect to academic topics.
2. **Use the student's performance data** (provided below) to personalize your responses. If they scored low in a topic, give extra detail. If they're strong, offer advanced extensions.
3. **Reference course material** when relevant — mention the student's actual enrolled courses by name.
4. **Use markdown formatting** for readability: bold key terms, use bullet points, numbered steps, and code blocks where appropriate.
5. **Show your work** — for math/science, always show step-by-step solutions.
6. **Be concise but thorough** — aim for 150-400 words unless the topic demands more detail.
7. **End with a thought-provoking follow-up question** to keep the student engaged.
8. **If you don't know the answer with certainty, say so** — never fabricate facts.

## Student Context
{student_context}

## Relevant Knowledge Base
{knowledge_context}
"""


# ─────────────────────────────────────────────
# Built-in knowledge base (fallback + RAG context)
# ─────────────────────────────────────────────

KNOWLEDGE_BASE: dict[str, dict[str, str]] = {
    # ── Calculus ──
    "chain rule": {
        "subject": "Calculus",
        "explanation": (
            "The **Chain Rule** differentiates composite functions f(g(x)):\n\n"
            "  d/dx [f(g(x))] = f'(g(x)) · g'(x)\n\n"
            "**Step-by-step:** 1) Identify outer and inner. 2) Differentiate outer, keep inner. "
            "3) Multiply by inner's derivative.\n\n"
            "**Example:** d/dx [sin(x²)] = cos(x²) · 2x = **2x·cos(x²)**"
        ),
    },
    "derivative": {
        "subject": "Calculus",
        "explanation": "A **derivative** measures rate of change. Power Rule: d/dx[xⁿ] = nxⁿ⁻¹. Product Rule: d/dx[fg] = f'g + fg'. Quotient Rule: d/dx[f/g] = (f'g - fg')/g².",
    },
    "integral": {
        "subject": "Calculus",
        "explanation": "An **integral** is the area under a curve. ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. Techniques: substitution, integration by parts (∫u dv = uv - ∫v du), partial fractions.",
    },
    "limit": {
        "subject": "Calculus",
        "explanation": "A **limit** describes a function's behavior as x approaches a value. lim(x→a) f(x) = L. L'Hôpital's Rule: if 0/0 or ∞/∞, lim f/g = lim f'/g'. Squeeze theorem: if g≤f≤h and lim g = lim h = L, then lim f = L.",
    },
    "taylor series": {
        "subject": "Calculus",
        "explanation": "**Taylor Series** expands f(x) around point a: f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ. Maclaurin (a=0): eˣ = 1+x+x²/2+..., sin(x) = x-x³/6+x⁵/120-..., cos(x) = 1-x²/2+x⁴/24-...",
    },
    "differential equation": {
        "subject": "Calculus",
        "explanation": "**Differential equations** relate a function to its derivatives. Separable: dy/dx = g(x)h(y) → ∫dy/h(y) = ∫g(x)dx. Linear 1st order: dy/dx + P(x)y = Q(x), use integrating factor μ = e^(∫P dx).",
    },
    # ── Algebra ──
    "quadratic": {
        "subject": "Algebra",
        "explanation": "Quadratic ax² + bx + c = 0. Solution: x = (-b ± √(b²-4ac))/2a. Discriminant Δ = b²-4ac: Δ>0 → 2 real roots, Δ=0 → 1 repeated, Δ<0 → 2 complex. Vertex form: a(x-h)² + k.",
    },
    "linear equation": {
        "subject": "Algebra",
        "explanation": "Linear equation y = mx + b. m = slope = rise/run = (y₂-y₁)/(x₂-x₁). b = y-intercept. Parallel lines: same slope. Perpendicular: slopes multiply to -1.",
    },
    "logarithm": {
        "subject": "Algebra",
        "explanation": "**Logarithms**: log_b(x) = y means bʸ = x. Laws: log(ab) = log(a)+log(b), log(a/b) = log(a)-log(b), log(aⁿ) = n·log(a). Change of base: log_b(x) = ln(x)/ln(b). Natural log: ln(e) = 1.",
    },
    "matrix": {
        "subject": "Linear Algebra",
        "explanation": "**Matrices**: rectangular arrays of numbers. Multiplication: (AB)ᵢⱼ = Σ aᵢₖbₖⱼ. Determinant 2×2: ad-bc. Inverse: A⁻¹ = (1/det)·adj(A). Eigenvalues: Av = λv, solve det(A-λI) = 0.",
    },
    "complex number": {
        "subject": "Algebra",
        "explanation": "**Complex numbers**: z = a + bi where i² = -1. Modulus: |z| = √(a²+b²). Conjugate: z̄ = a-bi. Euler: e^(iθ) = cos θ + i sin θ. De Moivre: (cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ).",
    },
    # ── Physics ──
    "newton": {
        "subject": "Physics",
        "explanation": "**Newton's Laws**: 1st — an object stays at rest or constant velocity unless acted on by a net force (inertia). 2nd — F = ma (force equals mass times acceleration). 3rd — every action has an equal and opposite reaction. Weight = mg where g ≈ 9.8 m/s².",
    },
    "energy": {
        "subject": "Physics",
        "explanation": "**Energy**: KE = ½mv² (kinetic), PE = mgh (gravitational potential). Conservation: total mechanical energy is constant in closed systems. Work-energy theorem: W_net = ΔKE. Power = Work/time = Fv.",
    },
    "momentum": {
        "subject": "Physics",
        "explanation": "**Momentum**: p = mv. Impulse: J = FΔt = Δp. Conservation: total momentum is conserved in collisions. Elastic: KE conserved. Inelastic: objects stick together, m₁v₁ + m₂v₂ = (m₁+m₂)v_f.",
    },
    "electromagnetism": {
        "subject": "Physics",
        "explanation": "**Electromagnetism**: Coulomb's Law F = kq₁q₂/r². Electric field E = F/q. Ohm's Law V = IR. Magnetic force F = qv×B. Faraday's Law: EMF = -dΦ/dt. Maxwell's equations unify electricity and magnetism.",
    },
    "wave": {
        "subject": "Physics",
        "explanation": "**Waves**: v = fλ (velocity = frequency × wavelength). Types: transverse (light), longitudinal (sound). Standing waves: nodes and antinodes. Doppler effect: frequency shifts when source/observer move. Sound speed ≈ 343 m/s in air.",
    },
    "thermodynamics": {
        "subject": "Physics",
        "explanation": "**Thermodynamics**: 0th Law — thermal equilibrium is transitive. 1st Law — ΔU = Q - W (energy conservation). 2nd Law — entropy never decreases in isolated systems. 3rd Law — entropy approaches zero at absolute zero. Efficiency = W/Q_hot.",
    },
    "relativity": {
        "subject": "Physics",
        "explanation": "**Special Relativity**: speed of light c is constant for all observers. Time dilation: t' = t/√(1-v²/c²). Length contraction: L' = L√(1-v²/c²). Mass-energy equivalence: E = mc². Nothing with mass can reach c.",
    },
    # ── Biology ──
    "mitosis": {
        "subject": "Biology",
        "explanation": "**Mitosis**: cell division producing 2 identical diploid cells. Phases: Prophase (chromatin condenses) → Metaphase (chromosomes align at plate) → Anaphase (sister chromatids separate) → Telophase (nuclear envelope reforms) → Cytokinesis (cytoplasm divides).",
    },
    "meiosis": {
        "subject": "Biology",
        "explanation": "**Meiosis**: two divisions producing 4 haploid gametes. Meiosis I separates homologous pairs (crossing over occurs in prophase I). Meiosis II separates sister chromatids. Genetic diversity from crossing over and independent assortment.",
    },
    "photosynthesis": {
        "subject": "Biology",
        "explanation": "**Photosynthesis**: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Light reactions (thylakoid membrane): water split, ATP and NADPH produced. Calvin Cycle (stroma): CO₂ fixed by RuBisCO into G3P, uses ATP and NADPH.",
    },
    "cellular respiration": {
        "subject": "Biology",
        "explanation": "**Cellular respiration**: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP. Stages: Glycolysis (cytoplasm, 2 ATP), Krebs Cycle (mitochondrial matrix, 2 ATP), Electron Transport Chain (inner membrane, ~32 ATP).",
    },
    "dna replication": {
        "subject": "Biology",
        "explanation": "**DNA Replication**: semi-conservative process. Helicase unwinds double helix. Primase adds RNA primer. DNA Polymerase III synthesizes new strand 5'→3'. Leading strand is continuous; lagging strand made in Okazaki fragments. Ligase seals fragments.",
    },
    "protein synthesis": {
        "subject": "Biology",
        "explanation": "**Protein Synthesis**: Transcription (nucleus): DNA → mRNA by RNA polymerase. mRNA is processed (5' cap, poly-A tail, introns spliced). Translation (ribosome): tRNA brings amino acids matching codon triplets. Start codon AUG (methionine).",
    },
    "evolution": {
        "subject": "Biology",
        "explanation": "**Evolution**: change in allele frequencies over time. Natural selection: organisms with advantageous traits survive and reproduce more. Evidence: fossils, homologous structures, DNA similarity. Hardy-Weinberg equilibrium: p² + 2pq + q² = 1 (no evolution conditions).",
    },
    "genetics": {
        "subject": "Biology",
        "explanation": "**Genetics**: Mendel's Laws — dominance, segregation, independent assortment. Genotype (genes) vs Phenotype (traits). Punnett squares predict offspring ratios. Incomplete dominance: blending. Codominance: both alleles expressed. Sex-linked traits on X chromosome.",
    },
    # ── Chemistry ──
    "periodic table": {
        "subject": "Chemistry",
        "explanation": "**Periodic Table**: elements by atomic number. Periods (rows) = energy levels. Groups (columns) = similar properties. Trends: atomic radius ↓ left→right (more protons), electronegativity ↑ left→right, ionization energy ↑ left→right. Group 1: alkali metals, Group 17: halogens, Group 18: noble gases.",
    },
    "chemical bond": {
        "subject": "Chemistry",
        "explanation": "**Chemical Bonds**: Ionic (electron transfer, metals+nonmetals, high melting point), Covalent (electron sharing, nonmetals, polar if unequal sharing), Metallic (electron sea, conducts electricity). Bond energy: triple > double > single. VSEPR theory predicts molecular geometry.",
    },
    "stoichiometry": {
        "subject": "Chemistry",
        "explanation": "**Stoichiometry**: quantitative relationships in chemical reactions. Balance equations by atom count. Mole ratios from coefficients. Limiting reagent determines max product. Percent yield = (actual/theoretical) × 100%. Molar mass from periodic table.",
    },
    "acid base": {
        "subject": "Chemistry",
        "explanation": "**Acids & Bases**: Arrhenius — acids produce H⁺, bases produce OH⁻. Brønsted-Lowry — acids donate protons, bases accept. Lewis — acids accept electron pairs. pH = -log[H⁺]. pH 7 = neutral, <7 = acidic, >7 = basic. Strong acids fully dissociate (HCl, H₂SO₄).",
    },
    "organic chemistry": {
        "subject": "Chemistry",
        "explanation": "**Organic Chemistry**: carbon-based compounds. Hydrocarbons: alkanes (C-C), alkenes (C=C), alkynes (C≡C). Functional groups: -OH (alcohol), -COOH (carboxylic acid), -NH₂ (amine), C=O (carbonyl). Isomers: same formula, different structure.",
    },
    "oxidation reduction": {
        "subject": "Chemistry",
        "explanation": "**Redox Reactions**: Oxidation = loss of electrons (OIL). Reduction = gain of electrons (RIG). Oxidizing agent is reduced. Reducing agent is oxidized. Assign oxidation numbers to track electron transfer. Electrochemistry uses redox for batteries.",
    },
    # ── Mathematics ──
    "trigonometry": {
        "subject": "Mathematics",
        "explanation": "**Trigonometry**: SOH-CAH-TOA. sin²θ + cos²θ = 1. Unit circle: sin(30°)=½, sin(45°)=√2/2, sin(60°)=√3/2. Law of Sines: a/sinA = b/sinB. Law of Cosines: c² = a² + b² - 2ab·cosC. Radian conversion: π rad = 180°.",
    },
    "probability": {
        "subject": "Statistics",
        "explanation": "**Probability**: P(A) = favorable/total. P(A∪B) = P(A)+P(B)-P(A∩B). Conditional: P(A|B) = P(A∩B)/P(B). Bayes' Theorem: P(A|B) = P(B|A)·P(A)/P(B). Independent events: P(A∩B) = P(A)·P(B). Permutations: nPr = n!/(n-r)!.",
    },
    "statistics": {
        "subject": "Statistics",
        "explanation": "**Statistics**: Mean = Σx/n. Median = middle value. Mode = most frequent. Std deviation σ = √(Σ(x-μ)²/n). Normal distribution: 68-95-99.7 rule. Z-score: z = (x-μ)/σ. Correlation: r ranges from -1 to 1. Regression: ŷ = mx + b.",
    },
    "set theory": {
        "subject": "Mathematics",
        "explanation": "**Set Theory**: Union A∪B (elements in either). Intersection A∩B (elements in both). Complement A' (not in A). Subset A⊆B. Empty set ∅. |A∪B| = |A| + |B| - |A∩B|. De Morgan's Laws: (A∪B)' = A'∩B', (A∩B)' = A'∪B'.",
    },
    # ── Computer Science ──
    "algorithm": {
        "subject": "Computer Science",
        "explanation": "**Algorithms**: step-by-step procedures. Time complexity with Big-O: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic. Common sorts: Merge Sort O(n log n), Quick Sort O(n log n avg), Bubble Sort O(n²).",
    },
    "data structure": {
        "subject": "Computer Science",
        "explanation": "**Data Structures**: Array (O(1) access), Linked List (O(1) insert), Stack (LIFO), Queue (FIFO), Hash Table (O(1) avg lookup), Binary Search Tree (O(log n) search), Heap (priority queue), Graph (vertices + edges).",
    },
    "recursion": {
        "subject": "Computer Science",
        "explanation": "**Recursion**: a function that calls itself. Must have: base case (stopping condition) and recursive case (moves toward base). Classic examples: factorial n! = n × (n-1)!, Fibonacci F(n) = F(n-1) + F(n-2). Can be replaced by iteration + stack.",
    },
    "object oriented": {
        "subject": "Computer Science",
        "explanation": "**OOP**: 4 pillars — Encapsulation (hiding internal state), Abstraction (simplifying interface), Inheritance (child extends parent), Polymorphism (same interface, different behavior). Classes define blueprints; objects are instances. SOLID principles guide good design.",
    },
    # ── History ──
    "world war": {
        "subject": "History",
        "explanation": "**WWII (1939-1945)**: Axis (Germany, Italy, Japan) vs Allies (UK, US, USSR). Key events: Germany invades Poland, Fall of France, Pearl Harbor (1941), D-Day (June 6, 1944), Battle of Stalingrad, atomic bombs on Hiroshima and Nagasaki. ~70-85M casualties. Led to UN creation.",
    },
    "french revolution": {
        "subject": "History",
        "explanation": "**French Revolution (1789-1799)**: Causes — social inequality (Three Estates), financial crisis, Enlightenment ideas. Events: Storming of Bastille, Declaration of Rights of Man, Reign of Terror under Robespierre, rise of Napoleon. Ended absolute monarchy, inspired democracy worldwide.",
    },
    "cold war": {
        "subject": "History",
        "explanation": "**Cold War (1947-1991)**: ideological conflict between US (capitalism/democracy) and USSR (communism). Never direct combat. Key events: Berlin Wall, Cuban Missile Crisis, Korean War, Vietnam War, Space Race, arms race (MAD). Ended with USSR dissolution in 1991.",
    },
    # ── Economics ──
    "supply demand": {
        "subject": "Economics",
        "explanation": "**Supply and Demand**: demand curve slopes down (price ↑, quantity demanded ↓). Supply curve slopes up. Equilibrium where curves intersect. Shifts: income changes shift demand, technology shifts supply. Price elasticity measures responsiveness to price changes.",
    },
    "gdp": {
        "subject": "Economics",
        "explanation": "**GDP (Gross Domestic Product)**: total market value of goods and services produced in a country. GDP = C + I + G + (X-M). Real GDP adjusts for inflation. GDP per capita = GDP/population. GDP growth rate measures economic health.",
    },
    # ── Literature ──
    "literary device": {
        "subject": "Literature",
        "explanation": "**Literary Devices**: Metaphor (implied comparison), Simile (using like/as), Personification (human qualities to non-human), Irony (opposite of expected), Foreshadowing (hints at future), Symbolism (object represents idea), Alliteration (repeated initial sounds).",
    },
    "essay writing": {
        "subject": "English",
        "explanation": "**Essay Structure**: Introduction (hook, context, thesis statement), Body paragraphs (topic sentence, evidence, analysis, transition), Conclusion (restate thesis, summarize, broader implication). Use PEEL: Point, Evidence, Explanation, Link.",
    },
}


# ─────────────────────────────────────────────
# Math equation solver (kept from original)
# ─────────────────────────────────────────────

def _solve_quadratic(a: float, b: float, c: float) -> str:
    discriminant = b**2 - 4 * a * c
    if discriminant > 0:
        x1 = (-b + math.sqrt(discriminant)) / (2 * a)
        x2 = (-b - math.sqrt(discriminant)) / (2 * a)
        return (
            f"Using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a\n\n"
            f"• a = {a}, b = {b}, c = {c}\n"
            f"• Discriminant Δ = {b}² - 4({a})({c}) = {discriminant}\n"
            f"• Since Δ > 0, there are **two real roots**\n\n"
            f"**x₁ = {x1:.4g}**\n**x₂ = {x2:.4g}**"
        )
    elif discriminant == 0:
        x = -b / (2 * a)
        return f"Discriminant = 0 → **One repeated root: x = {x:.4g}**"
    else:
        real = -b / (2 * a)
        imag = math.sqrt(-discriminant) / (2 * a)
        return f"Discriminant < 0 → **Two complex roots:** **x = {real:.4g} ± {imag:.4g}i**"


def _try_solve_equation(query: str) -> str | None:
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
    return None


# ─────────────────────────────────────────────
# AI Tutor Service
# ─────────────────────────────────────────────

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

    # ── RAG: Gather student context ─────────────────────────

    async def _build_student_context(self, user_id: UUID) -> str:
        """Build a rich student context string from database data for RAG."""
        if not self.db:
            return "No student data available."

        parts: list[str] = []

        try:
            # 1. Enrolled courses
            courses_q = await self.db.execute(
                select(Course.title, Course.subject)
                .join(Enrollment, Enrollment.course_id == Course.id)
                .where(Enrollment.student_user_id == user_id)
            )
            courses = courses_q.all()
            if courses:
                course_list = ", ".join(f"{c.title} ({c.subject})" for c in courses)
                parts.append(f"**Enrolled Courses:** {course_list}")
            else:
                parts.append("**Enrolled Courses:** None yet")

            # 2. Recent quiz performance
            results_q = await self.db.execute(
                select(QuizResult.score, QuizAttempt.created_at)
                .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
                .where(QuizAttempt.student_user_id == user_id)
                .order_by(QuizAttempt.created_at.desc())
                .limit(10)
            )
            results = results_q.all()
            if results:
                scores = [r.score * 100 for r in results]
                avg = sum(scores) / len(scores)
                best = max(scores)
                worst = min(scores)
                parts.append(
                    f"**Recent Quiz Performance:** {len(results)} quizzes taken, "
                    f"Average: {avg:.0f}%, Best: {best:.0f}%, Lowest: {worst:.0f}%"
                )
                if avg < 60:
                    parts.append("⚠️ Student is struggling — provide extra detail and encouragement.")
                elif avg >= 85:
                    parts.append("🌟 Student is performing well — offer advanced extensions and challenges.")
            else:
                parts.append("**Quiz Performance:** No quizzes taken yet — assume beginner level.")

            # 3. Weak topics (from question-level analysis)
            weak_q = await self.db.execute(
                select(Question.topic_tags, Question.correct_index, QuizAttempt.answers)
                .join(QuizAttempt, QuizAttempt.quiz_id == Question.quiz_id)
                .where(
                    QuizAttempt.student_user_id == user_id,
                    QuizAttempt.submitted_at.isnot(None),
                )
                .limit(100)
            )
            weak_rows = weak_q.all()
            topic_scores: dict[str, dict[str, int]] = {}
            for tags, correct_idx, answers in weak_rows:
                if not tags or not answers:
                    continue
                for tag in (tags if isinstance(tags, list) else [tags]):
                    if tag not in topic_scores:
                        topic_scores[tag] = {"correct": 0, "total": 0}
                    topic_scores[tag]["total"] += 1

            if topic_scores:
                weak_topics = [
                    t for t, s in topic_scores.items()
                    if s["total"] >= 2 and (s["correct"] / s["total"]) < 0.6
                ]
                if weak_topics:
                    parts.append(f"**Weak Topics Needing Review:** {', '.join(weak_topics[:8])}")

        except Exception as e:
            logger.error(f"Error building student context: {e}")
            parts.append("Student context unavailable due to data error.")

        return "\n".join(parts) if parts else "No student data available."

    # ── RAG: Retrieve knowledge base snippets ───────────────

    def _search_knowledge_base(self, query: str) -> str:
        """Find relevant knowledge base entries for the query."""
        query_lower = query.lower()
        matches: list[str] = []

        for keyword, data in KNOWLEDGE_BASE.items():
            score = 0
            if keyword in query_lower:
                score = len(keyword)
            else:
                kw_words = keyword.split()
                matched_words = sum(1 for w in kw_words if w in query_lower)
                if matched_words > 0:
                    score = matched_words * 0.5

            if score > 0:
                matches.append(f"**{keyword.title()} ({data['subject']}):** {data['explanation']}")

        if matches:
            return "\n\n".join(matches[:3])  # Top 3 matches
        return "No specific knowledge base entry found for this query."

    # ── Conversation history ────────────────────────────────

    async def _get_conversation_messages(self, user_id: UUID, conversation_id: UUID | None = None, limit: int = 10) -> list[dict[str, str]]:
        """Get recent messages for multi-turn conversation context."""
        if not self.db:
            return []

        try:
            if conversation_id:
                msgs_q = await self.db.execute(
                    select(AIMessage.role, AIMessage.content)
                    .where(AIMessage.conversation_id == conversation_id)
                    .order_by(AIMessage.created_at.desc())
                    .limit(limit)
                )
            else:
                # Find latest conversation
                conv_q = await self.db.execute(
                    select(AIConversation.id)
                    .where(AIConversation.user_id == user_id)
                    .order_by(AIConversation.created_at.desc())
                    .limit(1)
                )
                conv_id = conv_q.scalar_one_or_none()
                if not conv_id:
                    return []
                msgs_q = await self.db.execute(
                    select(AIMessage.role, AIMessage.content)
                    .where(AIMessage.conversation_id == conv_id)
                    .order_by(AIMessage.created_at.desc())
                    .limit(limit)
                )

            messages = msgs_q.all()
            return [{"role": m.role, "content": m.content} for m in reversed(messages)]
        except Exception:
            return []

    # ── Save message to DB ──────────────────────────────────

    async def _save_message(self, user_id: UUID, role: str, content: str, conversation_id: UUID | None = None) -> UUID | None:
        if not self.db:
            return None

        try:
            if not conversation_id:
                conv_q = await self.db.execute(
                    select(AIConversation)
                    .where(AIConversation.user_id == user_id)
                    .order_by(AIConversation.created_at.desc())
                    .limit(1)
                )
                conv = conv_q.scalar_one_or_none()

                if conv:
                    msg_count = await self.db.execute(
                        select(func.count(AIMessage.id)).where(AIMessage.conversation_id == conv.id)
                    )
                    if (msg_count.scalar() or 0) > 50:
                        conv = None

                if not conv:
                    conv = AIConversation(user_id=user_id, title="AI Tutor Session")
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

    # ── Gemini API call ─────────────────────────────────────

    async def _call_gemini(self, query: str, student_context: str, knowledge_context: str, history: list[dict[str, str]]) -> str | None:
        """Call Gemini API with the full RAG context. Returns None on failure."""
        model = _get_gemini_model()
        if model is None:
            return None

        try:
            # Build the system prompt with RAG context
            system = SYSTEM_PROMPT.format(
                student_context=student_context,
                knowledge_context=knowledge_context,
            )

            # Build conversation contents for Gemini
            contents: list[dict[str, Any]] = []

            # Add conversation history
            for msg in history[-8:]:  # Last 8 messages for context window
                gemini_role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": gemini_role, "parts": [msg["content"]]})

            # Add the current user query
            contents.append({"role": "user", "parts": [query]})

            # Generate response
            response = model.generate_content(
                contents,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_output_tokens": 2048,
                },
                system_instruction=system,
            )

            if response and response.text:
                return response.text.strip()
            return None

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return None

    # ── Get conversation history (public) ───────────────────

    async def get_conversation_history(self, user_id: UUID, limit: int = 20) -> list[dict]:
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

    # ── List all conversations ──────────────────────────────

    async def list_conversations(self, user_id: UUID) -> list[dict]:
        if not self.db:
            return []

        try:
            convs_q = await self.db.execute(
                select(AIConversation)
                .where(AIConversation.user_id == user_id)
                .order_by(AIConversation.created_at.desc())
                .limit(20)
            )
            convs = convs_q.scalars().all()
            return [
                {
                    "id": str(c.id),
                    "title": c.title,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in convs
            ]
        except Exception:
            return []

    # ── Main entry point ────────────────────────────────────

    async def get_tutor_response(self, query: str, user_id: str | UUID, conversation_id: str | UUID | None = None) -> str:
        """Main entry — generates an intelligent RAG-powered response."""
        if not self.validate_query(query):
            return "Please provide a clear question so I can help you learn. Try asking about a specific topic like calculus, physics, or biology."

        uid = UUID(str(user_id)) if isinstance(user_id, str) else user_id
        cid = UUID(str(conversation_id)) if conversation_id else None

        # Save user message
        conv_id = await self._save_message(uid, "user", query, cid)

        # 1. Try to solve a math equation directly
        equation_result = _try_solve_equation(query)
        if equation_result:
            response = f"📐 **Equation Solver**\n\n{equation_result}"
            await self._save_message(uid, "assistant", response, conv_id)
            return response

        # 2. Build RAG context
        student_context = await self._build_student_context(uid)
        knowledge_context = self._search_knowledge_base(query)
        history = await self._get_conversation_messages(uid, conv_id)

        # 3. Try Gemini API
        gemini_response = await self._call_gemini(query, student_context, knowledge_context, history)
        if gemini_response:
            await self._save_message(uid, "assistant", gemini_response, conv_id)
            return gemini_response

        # 4. Fallback: use knowledge base directly
        kb_result = self._search_knowledge_base_full(query)
        if kb_result:
            response = f"📚 **AI Tutor Response**\n\n{kb_result}"
            context_note = await self._get_student_performance_note(uid)
            response += context_note
            await self._save_message(uid, "assistant", response, conv_id)
            return response

        # 5. Fallback: generic educational response
        response = self._generate_fallback_response(query)
        await self._save_message(uid, "assistant", response, conv_id)
        return response

    # ── Fallback helpers ────────────────────────────────────

    def _search_knowledge_base_full(self, query: str) -> str | None:
        """Full-text knowledge base search (fallback when Gemini is unavailable)."""
        query_lower = query.lower()
        best_match = None
        best_score = 0

        for keyword, data in KNOWLEDGE_BASE.items():
            score = 0
            if keyword in query_lower:
                score = len(keyword)
            else:
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

    async def _get_student_performance_note(self, user_id: UUID) -> str:
        if not self.db:
            return ""
        try:
            results_q = await self.db.execute(
                select(QuizResult.score)
                .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
                .where(QuizAttempt.student_user_id == user_id)
                .order_by(QuizResult.created_at.desc())
                .limit(5)
            )
            results = results_q.all()
            if results:
                avg = sum(r.score for r in results) / len(results)
                return f"\n\n💡 *Based on your recent performance (avg: {avg*100:.0f}%), I've tailored this explanation to your level.*"
            return ""
        except Exception:
            return ""

    def _generate_fallback_response(self, query: str) -> str:
        query_lower = query.lower()
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
            f"While I'm currently operating in offline mode (no AI API key configured), here's my approach:\n\n"
            f"**Study Tip:** {tips[detected]}\n\n"
            f"**What you can do:**\n"
            f"1. Review your course materials on this topic\n"
            f"2. Practice with related quiz questions on the platform\n"
            f"3. Try rephrasing your question with more specific terms\n\n"
            f"*Configure a Gemini API key to unlock full AI-powered tutoring!*"
        )
