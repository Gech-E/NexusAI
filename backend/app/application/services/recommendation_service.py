"""
Recommendation Service — AI-powered personalized learning recommendations.

Uses Gemini to analyze student performance and generate targeted recommendations.
Falls back to rule-based heuristics when Gemini is unavailable.
"""

import json
import logging
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.ai_data import Recommendation
from app.infrastructure.models.academic import Course, Enrollment
from app.infrastructure.models.assessment import QuizAttempt, QuizResult, Question

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommendations_for_user(self, user_id: UUID) -> list[dict]:
        result = await self.db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at.desc())
            .limit(10)
        )
        recs = result.scalars().all()

        if not recs:
            # Auto-generate on first access
            await self.generate_recommendations(user_id)
            result = await self.db.execute(
                select(Recommendation)
                .where(Recommendation.user_id == user_id)
                .order_by(Recommendation.created_at.desc())
                .limit(10)
            )
            recs = result.scalars().all()

        return [
            {
                "id": str(r.id),
                "resource_type": r.resource_type,
                "resource_id": str(r.resource_id) if r.resource_id else None,
                "title": r.title,
                "reason": r.reason,
                "score": r.relevance_score,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recs
        ]

    async def generate_recommendations(self, user_id: UUID) -> int:
        """Generate personalized recommendations using AI or rule-based fallback."""
        # Gather student data
        student_data = await self._gather_student_data(user_id)

        # Try AI-powered recommendations
        ai_recs = await self._generate_ai_recommendations(student_data)

        if not ai_recs:
            # Fallback to rule-based
            ai_recs = self._generate_rule_based_recommendations(student_data)

        # Clear old recommendations
        old_q = await self.db.execute(
            select(Recommendation).where(Recommendation.user_id == user_id)
        )
        for old in old_q.scalars().all():
            await self.db.delete(old)

        # Save new ones
        count = 0
        for rec_data in ai_recs:
            rec = Recommendation(
                user_id=user_id,
                resource_type=rec_data.get("resource_type", "lesson"),
                title=rec_data["title"],
                reason=rec_data["reason"],
                relevance_score=rec_data.get("score", 0.8),
            )
            self.db.add(rec)
            count += 1

        await self.db.commit()
        return count

    async def _gather_student_data(self, user_id: UUID) -> dict:
        """Gather comprehensive student performance data for recommendation generation."""
        data: dict = {"user_id": str(user_id), "courses": [], "quiz_scores": [], "weak_topics": []}

        try:
            # Enrolled courses
            courses_q = await self.db.execute(
                select(Course.title, Course.subject, Enrollment.progress_pct)
                .join(Enrollment, Enrollment.course_id == Course.id)
                .where(Enrollment.student_user_id == user_id)
            )
            data["courses"] = [
                {"title": c.title, "subject": c.subject, "progress": c.progress_pct}
                for c in courses_q.all()
            ]

            # Recent quiz results
            results_q = await self.db.execute(
                select(QuizResult.score, QuizAttempt.created_at)
                .join(QuizAttempt, QuizResult.attempt_id == QuizAttempt.id)
                .where(QuizAttempt.student_user_id == user_id)
                .order_by(QuizAttempt.created_at.desc())
                .limit(20)
            )
            data["quiz_scores"] = [
                {"score": round(r.score * 100, 1), "date": r.created_at.isoformat() if r.created_at else None}
                for r in results_q.all()
            ]

            # Weak topics from question analysis
            questions_q = await self.db.execute(
                select(Question.topic_tags, Question.correct_index, QuizAttempt.answers)
                .join(QuizAttempt, QuizAttempt.quiz_id == Question.quiz_id)
                .where(
                    QuizAttempt.student_user_id == user_id,
                    QuizAttempt.submitted_at.isnot(None),
                )
                .limit(100)
            )
            topic_perf: dict[str, dict[str, int]] = {}
            for tags, correct_idx, answers in questions_q.all():
                if not tags or not answers:
                    continue
                for tag in (tags if isinstance(tags, list) else [tags]):
                    if tag not in topic_perf:
                        topic_perf[tag] = {"correct": 0, "total": 0}
                    topic_perf[tag]["total"] += 1

            data["weak_topics"] = [
                {"topic": t, "score": round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0}
                for t, s in topic_perf.items()
                if s["total"] >= 2
            ]

            # Overall average
            if data["quiz_scores"]:
                data["average_score"] = round(
                    sum(s["score"] for s in data["quiz_scores"]) / len(data["quiz_scores"]), 1
                )
            else:
                data["average_score"] = None

        except Exception as e:
            logger.error(f"Error gathering student data: {e}")

        return data

    async def _generate_ai_recommendations(self, student_data: dict) -> list[dict] | None:
        """Use Gemini to generate personalized recommendations."""
        from app.core.config import settings
        if not settings.gemini_api_key:
            return None

        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model)

            prompt = f"""You are an AI learning advisor. Based on the following student data, generate exactly 5 personalized learning recommendations.

**Student Data:**
- Enrolled Courses: {json.dumps(student_data.get("courses", []))}
- Recent Quiz Scores: {json.dumps(student_data.get("quiz_scores", [])[:10])}
- Weak Topics: {json.dumps(student_data.get("weak_topics", []))}
- Overall Average: {student_data.get("average_score", "N/A")}%

**Requirements:**
1. Each recommendation should target a specific weakness or growth opportunity
2. Include a mix of resource types: "lesson", "practice", "review", "quiz", "challenge"
3. Provide a clear, motivating reason for each recommendation
4. Assign a relevance score from 0.5 to 1.0 based on urgency

**Respond ONLY with a valid JSON array** of exactly 5 objects, each with these keys:
- "title": string (concise name, max 60 chars)
- "reason": string (1-2 sentence explanation, max 150 chars)
- "resource_type": string (one of: lesson, practice, review, quiz, challenge)
- "score": float (0.5 to 1.0)

Example: [{{"title": "Integration Review", "reason": "Score dropped 20% on integral problems", "resource_type": "review", "score": 0.95}}]"""

            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.5, "max_output_tokens": 1024},
            )

            if response and response.text:
                # Parse JSON from response
                text = response.text.strip()
                # Handle markdown code blocks
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

                recs = json.loads(text)
                if isinstance(recs, list) and len(recs) > 0:
                    # Validate and sanitize
                    valid_recs = []
                    for r in recs[:5]:
                        if isinstance(r, dict) and "title" in r and "reason" in r:
                            valid_recs.append({
                                "title": str(r["title"])[:60],
                                "reason": str(r["reason"])[:150],
                                "resource_type": r.get("resource_type", "lesson"),
                                "score": min(max(float(r.get("score", 0.8)), 0.5), 1.0),
                            })
                    if valid_recs:
                        logger.info(f"Gemini generated {len(valid_recs)} recommendations")
                        return valid_recs

        except Exception as e:
            logger.error(f"AI recommendation generation failed: {e}")

        return None

    def _generate_rule_based_recommendations(self, student_data: dict) -> list[dict]:
        """Fallback: generate recommendations using heuristics."""
        recs = []
        avg = student_data.get("average_score")
        courses = student_data.get("courses", [])
        weak = student_data.get("weak_topics", [])

        # Based on weak topics
        for topic in weak[:3]:
            recs.append({
                "title": f"{topic['topic']} Review",
                "reason": f"Your score on {topic['topic']} questions needs improvement",
                "resource_type": "review",
                "score": 0.95,
            })

        # Based on course progress
        for course in courses:
            if course.get("progress", 0) < 50:
                recs.append({
                    "title": f"Continue: {course['title'][:40]}",
                    "reason": f"You're {course.get('progress', 0):.0f}% through — keep going!",
                    "resource_type": "lesson",
                    "score": 0.85,
                })

        # Based on overall performance
        if avg is not None and avg < 60:
            recs.append({
                "title": "Fundamentals Refresher",
                "reason": f"Average of {avg:.0f}% — review core concepts to build a stronger foundation",
                "resource_type": "review",
                "score": 0.90,
            })
        elif avg is not None and avg >= 85:
            recs.append({
                "title": "Advanced Challenge Set",
                "reason": f"Impressive {avg:.0f}% average! Ready for harder problems",
                "resource_type": "challenge",
                "score": 0.80,
            })

        # Ensure at least 5 recs
        defaults = [
            {"title": "Practice Quiz: Mixed Topics", "reason": "Regular practice improves retention by 40%", "resource_type": "quiz", "score": 0.75},
            {"title": "Study Techniques Guide", "reason": "Learn evidence-based study methods", "resource_type": "lesson", "score": 0.70},
            {"title": "Weekly Review Session", "reason": "Spaced repetition strengthens long-term memory", "resource_type": "review", "score": 0.65},
            {"title": "Peer Discussion Topics", "reason": "Teaching others is the best way to learn", "resource_type": "practice", "score": 0.60},
            {"title": "Timed Practice Exam", "reason": "Build exam confidence with timed practice", "resource_type": "quiz", "score": 0.55},
        ]
        for d in defaults:
            if len(recs) >= 5:
                break
            # Don't duplicate titles
            if not any(r["title"] == d["title"] for r in recs):
                recs.append(d)

        return recs[:5]
