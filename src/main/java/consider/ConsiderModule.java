package consider;

import com.google.inject.AbstractModule;
import com.google.inject.Singleton;

public class ConsiderModule extends AbstractModule {
    @Override
    protected void configure() {
        bind(ReviewSessionStore.class).in(Singleton.class);
        bind(ReviewSessionResource.class);
        bind(ReviewSessionsResource.class);
    }
}
