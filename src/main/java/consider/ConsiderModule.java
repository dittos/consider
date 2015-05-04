package consider;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import io.dropwizard.hibernate.HibernateBundle;
import org.hibernate.SessionFactory;

public class ConsiderModule extends AbstractModule {
    private final HibernateBundle<ConsiderConfiguration> hibernateBundle;

    public ConsiderModule(HibernateBundle<ConsiderConfiguration> hibernateBundle) {
        this.hibernateBundle = hibernateBundle;
    }

    @Override
    protected void configure() {
        bind(ReviewSessionStore.class).in(Singleton.class);
        bind(LineCommentStore.class).in(Singleton.class);

        bind(ReviewSessionResource.class);
        bind(ReviewSessionsResource.class);
    }

    @Provides
    public SessionFactory provideSessionFactory() {
        return hibernateBundle.getSessionFactory();
    }
}
