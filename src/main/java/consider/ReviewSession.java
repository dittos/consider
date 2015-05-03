package consider;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class ReviewSession {
    @Id
    @GeneratedValue
    public Long id;

    public String sourceBranch;
    public String targetBranch;
}
