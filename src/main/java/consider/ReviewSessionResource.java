package consider;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ast.CompilationUnit;
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
import javax.ws.rs.*;
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
    private final LineCommentStore commentStore;

    @Inject
    public ReviewSessionResource(ConsiderConfiguration config, ReviewSessionStore store, LineCommentStore commentStore) {
        this.config = config;
        this.store = store;
        this.commentStore = commentStore;
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
            change.commentCount = commentStore.count(session, change.oldId, change.newId);
            return change;
        }).collect(Collectors.toList());
        return response;
    }

    @GET
    @Path("/blobs/{blobId}")
    @Produces(MediaType.TEXT_PLAIN)
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

    @GET
    @Path("/blobs/{blobId}/structure")
    public JavaStructure getBlobStructure(@PathParam("blobId") String blobId) throws Exception {
        Git git = Git.open(config.repo);
        Repository repo = git.getRepository();
        ObjectLoader loader = repo.open(ObjectId.fromString(blobId));
        try (InputStream stream = loader.openStream()) {
            CompilationUnit cu = JavaParser.parse(stream);
            return JavaStructure.create(cu);
        } finally {
            git.close();
        }
    }

    @GET
    @Path("/blobs/{blobId}/comments")
    @UnitOfWork
    public List<LineComment> getCommentsOnBlob(@PathParam("id") long id, @PathParam("blobId") String blobId) throws Exception {
        ReviewSession reviewSession = store.get(id);
        return commentStore.find(reviewSession, blobId);
    }

    @POST
    @Path("/blobs/{blobId}/comments")
    @Consumes(MediaType.APPLICATION_JSON)
    @UnitOfWork
    public LineComment createCommentOnBlob(@PathParam("id") long id, @PathParam("blobId") String blobId, CreateLineCommentRequest request) throws Exception {
        ReviewSession reviewSession = store.get(id);
        LineComment comment = new LineComment();
        comment.blobId = blobId;
        comment.reviewSession = reviewSession;
        comment.lineNumber = request.lineNumber;
        comment.content = request.content;
        comment.createdTime = System.currentTimeMillis();
        commentStore.add(comment);
        return comment;
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
