package consider;

import io.dropwizard.Configuration;
import io.dropwizard.db.DataSourceFactory;

import java.io.File;

public class ConsiderConfiguration extends Configuration {
    // FIXME
    public File repo = new File("/Users/ditto/repo/gh/netty");

    public DataSourceFactory database;
}
