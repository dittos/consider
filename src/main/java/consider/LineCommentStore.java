package consider;

import java.util.List;

public class LineCommentStore extends AbstractStore {
    public void add(LineComment comment) {
        currentSession().persist(comment);
    }

    public List<LineComment> find(ReviewSession reviewSession, String blobId) {
        return query().from(QLineComment.lineComment)
                .where(QLineComment.lineComment.reviewSession.eq(reviewSession)
                        .and(QLineComment.lineComment.blobId.eq(blobId)))
                .list(QLineComment.lineComment);
    }
}
