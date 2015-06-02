package consider;

import com.github.javaparser.ast.AccessSpecifier;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.ModifierSet;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.TypeDeclaration;

import java.util.List;
import java.util.stream.Collectors;

public class JavaStructure {
    public List<TypeItem> types;

    public static JavaStructure create(CompilationUnit cu) {
        JavaStructure result = new JavaStructure();
        result.types = cu.getTypes().stream()
                .map(TypeItem::create)
                .collect(Collectors.toList());
        return result;
    }

    public static class TypeItem {
        public String name;
        public int lineNumber;
        public List<TypeItem> types;
        public List<MethodItem> methods;

        public static TypeItem create(TypeDeclaration typeDeclaration) {
            TypeItem item = new TypeItem();
            item.name = typeDeclaration.getName();
            item.lineNumber = typeDeclaration.getBeginLine();
            if (typeDeclaration.getMembers() != null) {
                item.types = typeDeclaration.getMembers().stream()
                        .filter(member -> member != null && member instanceof TypeDeclaration)
                        .map(member -> TypeItem.create((TypeDeclaration) member))
                        .collect(Collectors.toList());
                item.methods = typeDeclaration.getMembers().stream()
                        .filter(member -> member != null && member instanceof MethodDeclaration)
                        .map(member -> MethodItem.create((MethodDeclaration) member))
                        .collect(Collectors.toList());
            }
            return item;
        }
    }

    public static class MethodItem {
        public boolean isStatic;
        public AccessSpecifier privacy;
        public String name, returnType, params;
        public int beginLineNumber;
        public int endLineNumber;

        public static MethodItem create(MethodDeclaration methodDecl) {
            MethodItem item = new MethodItem();
            item.isStatic = ModifierSet.isStatic(methodDecl.getModifiers());
            item.privacy = ModifierSet.getAccessSpecifier(methodDecl.getModifiers());
            item.name = methodDecl.getName();
            item.returnType = methodDecl.getType().toStringWithoutComments();
            String params = "";
            boolean isFirst = true;
            for (Parameter param : methodDecl.getParameters()) {
                if (!isFirst)
                    params += ", ";
                isFirst = false;
                params += param.getType().toStringWithoutComments();
                if (param.isVarArgs())
                    params += "...";
            }
            item.params = params;
            item.beginLineNumber = methodDecl.getBeginLine();
            item.endLineNumber = methodDecl.getEndLine();
            return item;
        }
    }
}
