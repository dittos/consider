package consider;

import java.util.List;

public class ReviewSessionStore extends AbstractStore {
    public ReviewSession get(long id) {
        return query().from(QReviewSession.reviewSession)
                .where(QReviewSession.reviewSession.id.eq(id))
                .uniqueResult(QReviewSession.reviewSession);
    }

    public List<ReviewSession> all() {
        return query().from(QReviewSession.reviewSession)
                .list(QReviewSession.reviewSession);
    }

    public void add(ReviewSession reviewSession) {
        currentSession().persist(reviewSession);
    }
}
