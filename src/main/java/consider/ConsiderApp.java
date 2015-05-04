package consider;

import com.hubspot.dropwizard.guice.GuiceBundle;
import io.dropwizard.Application;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.hibernate.HibernateBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.context.internal.ManagedSessionContext;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;

public class ConsiderApp extends Application<ConsiderConfiguration> {
    private GuiceBundle<ConsiderConfiguration> guiceBundle;
    private HibernateBundle<ConsiderConfiguration> hibernateBundle;
    private DataSourceFactory dataSourceFactory;

    public static void main(String[] args) throws Exception {
        new ConsiderApp().run(args);
    }

    @Override
    public void initialize(Bootstrap<ConsiderConfiguration> bootstrap) {
        dataSourceFactory = new DataSourceFactory();
        dataSourceFactory.setDriverClass("org.hsqldb.jdbc.JDBCDriver");
        dataSourceFactory.setUrl("jdbc:hsqldb:mem:mymemdb");
        dataSourceFactory.setValidationQuery("SELECT * FROM INFORMATION_SCHEMA.SYSTEM_TABLES");
        Map<String, String> props = new HashMap<>();
        props.put("hibernate.dialect", "org.hibernate.dialect.HSQLDialect");
        props.put("hibernate.hbm2ddl.auto", "create");
        dataSourceFactory.setProperties(props);
        hibernateBundle = new HibernateBundle<ConsiderConfiguration>(ReviewSession.class, LineComment.class) {
            @Override
            public DataSourceFactory getDataSourceFactory(ConsiderConfiguration configuration) {
                return dataSourceFactory;
            }
        };
        bootstrap.addBundle(hibernateBundle);

        guiceBundle = GuiceBundle.<ConsiderConfiguration>newBuilder()
                .addModule(new ConsiderModule(hibernateBundle))
                .setConfigClass(ConsiderConfiguration.class)
                .build();
        bootstrap.addBundle(guiceBundle);
    }

    @Override
    public void run(ConsiderConfiguration configuration, Environment environment) throws Exception {
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
        try {
            ReviewSessionStore store = guiceBundle.getInjector().getInstance(ReviewSessionStore.class);
            ReviewSession reviewSession = new ReviewSession();
            reviewSession.sourceBranch = "newheaders";
            reviewSession.targetBranch = "master";
            store.add(reviewSession);
        } finally {
            tx.commit();
            session.close();
            session = null;
            ManagedSessionContext.unbind(hibernateBundle.getSessionFactory());
        }
    }
}
