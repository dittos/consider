package consider;

import com.fasterxml.jackson.annotation.JsonValue;

public class ReviewSession {
    public Id id;
    public String sourceBranch;
    public String targetBranch;

    public static class Id {
        private final long id;

        public Id(long id) {
            this.id = id;
        }

        @JsonValue
        @Override
        public String toString() {
            return Long.toString(id);
        }
    }
}
