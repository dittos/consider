package consider;

import javax.persistence.*;

@Entity
public class LineComment {
    @Id
    @GeneratedValue
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn
    public ReviewSession reviewSession;

    public String content;

    public String blobId;

    public int lineNumber;

    public long createdTime;
}
