package com.project._3.entities;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 3000, nullable = false)
    private String questionBody;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficulty;

    @Enumerated(EnumType.STRING)
    private RequiredUsage requiredUsage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Topics topic;

    @Column(length = 5000)
    private String starterCode;


    public enum QuestionType {
        MULTIPLE_CHOICE,
        PRACTICAL
    }

    public enum DifficultyLevel {
        EASY,
        MEDIUM,
        HARD
    }

    public enum RequiredUsage {

        // Condicionais
        IF,
        ELSE,
        SWITCH,

        // Loops
        FOR,
        WHILE,
        DO_WHILE,
        FOREACH,

        // Funções
        FUNCTION,
        RETURN,
        RECURSION,

        // Variáveis
        VARIABLE,
        CONST,
        LET,

        // Tipos
        STRING,
        NUMBER,
        BOOLEAN,
        ARRAY,
        OBJECT,

        // Operadores
        COMPARISON,
        LOGICAL_OPERATOR,
        ARITHMETIC_OPERATOR,

        // Estruturas
        CLASS,
        INTERFACE,
        ENUM,

        // Manipulação de arrays
        ARRAY_PUSH,
        ARRAY_POP,
        ARRAY_MAP,
        ARRAY_FILTER,
        ARRAY_FIND,
        ARRAY_REDUCE,

        // Manipulação de strings
        STRING_CONCAT,
        TEMPLATE_LITERAL,

        // Funções modernas
        ARROW_FUNCTION,
        ASYNC,
        AWAIT,
        PROMISE,

        // Tratamento de erros
        TRY_CATCH,
        THROW,

        // Objetos
        OBJECT_DESTRUCTURING,
        SPREAD_OPERATOR,

        // Imports
        IMPORT,
        EXPORT,

        // Entrada/Saída
        CONSOLE_LOG,

        // Matemática
        MATH_RANDOM,
        MATH_FLOOR,
        MATH_CEIL,

        // Algoritmos
        SORT,
        SEARCH,

        // Boas práticas
        TYPE_ANNOTATION,

        // Complexidade / Estrutura
        NESTED_LOOP,
        CONDITIONAL_INSIDE_LOOP,

        // Especiais educacionais
        NO_FOR_ALLOWED,
        NO_WHILE_ALLOWED,
        NO_IF_ALLOWED,
        NO_RECURSION_ALLOWED
    }

    public enum Topics {
        OPERADORES_TIPOS_E_VARIAVEIS,
        EXECUCAO_CONDICIONAL,
        OPERADORES_LOGICOS,
        LACOS,
        SUBPROGRAMAS,
        VETORES,
        ARRAYS,
        TIPOS_CRIADOS_PELO_PROGRAMADOR
    }
}
