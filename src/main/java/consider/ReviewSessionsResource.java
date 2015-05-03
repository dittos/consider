package consider;

import io.dropwizard.hibernate.UnitOfWork;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/review-sessions")
@Produces(MediaType.APPLICATION_JSON)
public class ReviewSessionsResource {
    private final ReviewSessionStore store;

    @Inject
    public ReviewSessionsResource(ReviewSessionStore store) {
        this.store = store;
    }

    @GET
    @UnitOfWork
    public GetReviewSessionsResponse get() {
        GetReviewSessionsResponse response = new GetReviewSessionsResponse();
        response.data = store.all();
        return response;
    }
}
