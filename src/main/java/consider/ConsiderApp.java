package consider;

import com.hubspot.dropwizard.guice.GuiceBundle;
import io.dropwizard.Application;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;

public class ConsiderApp extends Application<ConsiderConfiguration> {
    private GuiceBundle<ConsiderConfiguration> guiceBundle;

    public static void main(String[] args) throws Exception {
        new ConsiderApp().run(args);
    }

    @Override
    public void initialize(Bootstrap<ConsiderConfiguration> bootstrap) {
        guiceBundle = GuiceBundle.<ConsiderConfiguration>newBuilder()
                .addModule(new ConsiderModule())
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
    }
}
