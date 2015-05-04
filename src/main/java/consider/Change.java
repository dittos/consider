package consider;

import org.eclipse.jgit.diff.DiffEntry;

public class Change {
    public DiffEntry.ChangeType type;
    public String oldPath;
    public String newPath;
    public String oldId;
    public String newId;
    public long commentCount;
}
