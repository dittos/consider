package consider;

import com.google.common.io.Files;
import com.hubspot.dropwizard.guice.GuiceBundle;
import io.dropwizard.Application;
import io.dropwizard.assets.AssetsBundle;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.hibernate.HibernateBundle;
import io.dropwizard.lifecycle.ServerLifecycleListener;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.egit.github.core.PullRequest;
import org.eclipse.egit.github.core.RepositoryId;
import org.eclipse.egit.github.core.service.PullRequestService;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlets.CrossOriginFilter;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ProgressMonitor;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.transport.RefSpec;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.context.internal.ManagedSessionContext;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.awt.*;
import java.io.File;
import java.io.IOException;
import java.util.EnumSet;

public class ConsiderApp extends Application<ConsiderConfiguration> {
    private GuiceBundle<ConsiderConfiguration> guiceBundle;
    private HibernateBundle<ConsiderConfiguration> hibernateBundle;
    private DataSourceFactory dataSourceFactory;

    public static void main(String[] args) throws Exception {
        new ConsiderApp().run(args);
    }

    @Override
    public void initialize(Bootstrap<ConsiderConfiguration> bootstrap) {
        hibernateBundle = new HibernateBundle<ConsiderConfiguration>(ReviewSession.class, LineComment.class) {
            @Override
            public DataSourceFactory getDataSourceFactory(ConsiderConfiguration configuration) {
                return configuration.database;
            }
        };
        bootstrap.addBundle(hibernateBundle);

        guiceBundle = GuiceBundle.<ConsiderConfiguration>newBuilder()
                .addModule(new ConsiderModule(hibernateBundle))
                .setConfigClass(ConsiderConfiguration.class)
                .build();
        bootstrap.addBundle(guiceBundle);

        bootstrap.addBundle(new AssetsBundle("/assets", "/", "index.html"));
    }

    @Override
    public void run(ConsiderConfiguration configuration, Environment environment) throws Exception {
        environment.lifecycle().addServerLifecycleListener(new ServerLifecycleListener() {
            @Override
            public void serverStarted(Server server) {
                try {
                    Desktop.getDesktop().browse(server.getURI());
                } catch (IOException e) {}
            }
        });

        // Enable CORS headers
        final FilterRegistration.Dynamic cors =
                environment.servlets().addFilter("CORS", CrossOriginFilter.class);

        // Configure CORS parameters
        cors.setInitParameter("allowedOrigins", "*");
        cors.setInitParameter("allowedHeaders", "X-Requested-With,Content-Type,Accept,Origin");
        cors.setInitParameter("allowedMethods", "OPTIONS,GET,PUT,POST,DELETE,HEAD");

        // Add URL mapping
        cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");

        Session session = hibernateBundle.getSessionFactory().openSession();
        ManagedSessionContext.bind(session);
        Transaction tx = session.beginTransaction();

        String id = System.getenv("CONSIDER_REPO");
        int prId = Integer.parseInt(System.getenv("CONSIDER_PR_ID"));
        PullRequestService prs = new PullRequestService();
        PullRequest pr = prs.getPullRequest(RepositoryId.createFromId(id), prId);

        File file = Files.createTempDir();
        Git.cloneRepository()
                .setDirectory(file)
                .setURI(pr.getBase().getRepo().getCloneUrl())
                .setBranch(pr.getBase().getRef())
                .setProgressMonitor(new ProgressMonitor() {
                    @Override
                    public void start(int totalTasks) {

                    }

                    @Override
                    public void beginTask(String title, int totalWork) {
                        System.out.println(title);
                    }

                    @Override
                    public void update(int completed) {
                    }

                    @Override
                    public void endTask() {
                    }

                    @Override
                    public boolean isCancelled() {
                        return false;
                    }
                })
                .call();
        StoredConfig config = Git.open(file).getRepository().getConfig();
        config.setString("remote", "source", "url", pr.getHead().getRepo().getCloneUrl());
        config.save();
        Git.open(file).fetch()
                .setRemote("source")
                .setRefSpecs(new RefSpec("+refs/heads/*:refs/remotes/source/*"))
                .call();
        configuration.repo = file;
        try {
            ReviewSessionStore store = guiceBundle.getInjector().getInstance(ReviewSessionStore.class);
            ReviewSession reviewSession = new ReviewSession();
            reviewSession.sourceBranch = pr.getHead().getRef();
            reviewSession.targetBranch = pr.getBase().getRef();
            store.add(reviewSession);
        } finally {
            tx.commit();
            session.close();
            session = null;
            ManagedSessionContext.unbind(hibernateBundle.getSessionFactory());
        }
    }
}
