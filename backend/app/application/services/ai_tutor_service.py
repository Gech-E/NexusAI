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
    "chain rule": {
        "subject": "Calculus",
        "explanation": (
            "The **Chain Rule** is used to differentiate composite functions. If you have a function "
            "f(g(x)), the derivative is:\n\n"
            "  d/dx [f(g(x))] = f'(g(x)) · g'(x)\n\n"
            "**Step-by-step:** 1) Identify outer and inner functions. "
            "2) Differentiate the outer, keeping inner unchanged. "
            "3) Multiply by the derivative of the inner function.\n\n"
            "**Example:** d/dx [sin(x²)] = cos(x²) · 2x = **2x·cos(x²)**"
        ),
    },
    "derivative": {
        "subject": "Calculus",
        "explanation": (
            "A **derivative** measures the rate of change of a function. "
            "Basic rules: Power Rule (d/dx[xⁿ] = nxⁿ⁻¹), "
            "Product Rule (d/dx[fg] = f'g + fg'), "
            "Quotient Rule (d/dx[f/g] = (f'g - fg')/g²)."
        ),
    },
    "integral": {
        "subject": "Calculus",
        "explanation": (
            "An **integral** calculates the area under a curve. "
            "∫xⁿ dx = xⁿ⁺¹/(n+1) + C. Key techniques: substitution, "
            "integration by parts, partial fractions."
        ),
    },
    "quadratic": {
        "subject": "Algebra",
        "explanation": (
            "Quadratic equation ax² + bx + c = 0. "
            "Solution: x = (-b ± √(b²-4ac)) / 2a. "
            "Discriminant Δ = b²-4ac determines root type."
        ),
    },
    "linear equation": {
        "subject": "Algebra",
        "explanation": "Linear equation y = mx + b. m = slope, b = y-intercept.",
    },
    "newton": {
        "subject": "Physics",
        "explanation": (
            "Newton's Laws: 1st (Inertia), 2nd (F=ma), 3rd (action-reaction). "
            "F=ma is the most useful for problem-solving."
        ),
    },
    "energy": {
        "subject": "Physics",
        "explanation": "KE = ½mv², PE = mgh. Conservation: total energy is constant in closed systems.",
    },
    "mitosis": {
        "subject": "Biology",
        "explanation": "Mitosis: prophase → metaphase → anaphase → telophase → cytokinesis. Produces 2 identical diploid cells.",
    },
    "meiosis": {
        "subject": "Biology",
        "explanation": "Meiosis: two divisions producing 4 haploid gametes. Includes crossing over for genetic diversity.",
    },
    "photosynthesis": {
        "subject": "Biology",
        "explanation": "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Light reactions (thylakoid) + Calvin cycle (stroma).",
    },
    "periodic table": {
        "subject": "Chemistry",
        "explanation": "Elements organized by atomic number. Trends: atomic radius ↓ left→right, electronegativity ↑ left→right.",
    },
    "chemical bond": {
        "subject": "Chemistry",
        "explanation": "Ionic (electron transfer), Covalent (electron sharing), Metallic (electron sea). Bond strength: triple > double > single.",
    },
    "trigonometry": {
        "subject": "Mathematics",
        "explanation": "SOH-CAH-TOA. sin²θ + cos²θ = 1. Unit circle: sin(30°)=½, sin(45°)=√2/2, sin(60°)=√3/2.",
    },
    "probability": {
        "subject": "Statistics",
        "explanation": "P(A) = favorable/total. P(A∪B) = P(A)+P(B)-P(A∩B). Bayes: P(A|B) = P(B|A)·P(A)/P(B).",
    },
    "world war": {
        "subject": "History",
        "explanation": "WWII (1939-1945): Germany invades Poland, Pearl Harbor, D-Day, atomic bombs. ~70-85M casualties.",
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
