package consider;

import com.mysema.query.jpa.JPQLQuery;
import com.mysema.query.jpa.hibernate.HibernateQuery;
import org.hibernate.Session;
import org.hibernate.SessionFactory;

import javax.inject.Inject;
import javax.inject.Provider;

public abstract class AbstractStore {
    @Inject
    private Provider<SessionFactory> sessionFactoryProvider;

    protected Session currentSession() {
        return sessionFactoryProvider.get().getCurrentSession();
    }

    protected JPQLQuery query() {
        return new HibernateQuery(currentSession());
    }
}
