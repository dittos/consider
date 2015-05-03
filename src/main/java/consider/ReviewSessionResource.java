package consider;

import io.dropwizard.hibernate.UnitOfWork;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.revwalk.filter.RevFilter;
import org.eclipse.jgit.treewalk.AbstractTreeIterator;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Path("/review-sessions/{id}")
@Produces(MediaType.APPLICATION_JSON)
public class ReviewSessionResource {
    private final ConsiderConfiguration config;
    private final ReviewSessionStore store;

    @Inject
    public ReviewSessionResource(ConsiderConfiguration config, ReviewSessionStore store) {
        this.config = config;
        this.store = store;
    }

    @GET
    @UnitOfWork
    public GetReviewSessionResponse get(@PathParam("id") long id) throws Exception {
        ReviewSession session = store.get(id);

        Git git = Git.open(config.repo);
        Repository repo = git.getRepository();
        Ref sourceBranch = repo.getRef("refs/heads/" + session.sourceBranch);
        Ref targetBranch = repo.getRef("refs/heads/" + session.targetBranch);

        RevWalk walk = new RevWalk(repo);
        RevCommit sourceCommit = walk.lookupCommit(sourceBranch.getObjectId());
        RevCommit targetCommit = walk.lookupCommit(targetBranch.getObjectId());
        walk.setRevFilter(RevFilter.MERGE_BASE);
        walk.markStart(sourceCommit);
        walk.markStart(targetCommit);
        RevCommit mergeBase = walk.next();
        List<DiffEntry> diffEntries = git.diff()
                .setNewTree(readTree(repo, sourceCommit))
                .setOldTree(readTree(repo, mergeBase))
                .call();
        repo.close();

        GetReviewSessionResponse response = new GetReviewSessionResponse();
        response.reviewSession = session;
        response.changes = diffEntries.stream().map(entry -> {
            Change change = new Change();
            change.type = entry.getChangeType();
            change.oldPath = entry.getOldPath();
            change.oldId = entry.getOldId().name();
            change.newPath = entry.getNewPath();
            change.newId = entry.getNewId().name();
            return change;
        }).collect(Collectors.toList());
        return response;
    }

    @GET
    @Path("/blobs/{blobId}")
    public InputStream getBlob(@PathParam("blobId") String blobId) throws Exception {
        Git git = Git.open(config.repo);
        Repository repo = git.getRepository();
        ObjectLoader loader = repo.open(ObjectId.fromString(blobId));
        try {
            return loader.openStream();
        } finally {
            git.close();
        }
    }

    private static AbstractTreeIterator readTree(Repository repo, RevCommit commit) throws IOException {
        CanonicalTreeParser p = new CanonicalTreeParser();
        ObjectReader r = repo.newObjectReader();
        try {
            p.reset(r, commit.getTree().getId());
        } finally {
            r.release();
        }
        return p;
    }
}
