package consider;

import java.util.Arrays;
import java.util.List;

public class ReviewSessionStore {
    public ReviewSession get(ReviewSession.Id id) {
        ReviewSession reviewSession = new ReviewSession();
        reviewSession.id = id;
        // FIXME
        reviewSession.sourceBranch = "ted/dto-moment";
        reviewSession.targetBranch = "master";
        return reviewSession;
    }

    public List<ReviewSession> all() {
        return Arrays.asList(get(new ReviewSession.Id(1L)));
    }
}
