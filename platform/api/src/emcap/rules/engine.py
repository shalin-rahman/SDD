import ast
import operator
from collections.abc import Callable
from typing import Any

ALLOWED_OPERATORS: dict[type, Callable[..., Any]] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.And: all,
    ast.Or: any,
}


class RuleEngineError(Exception):
    pass


class FormulaEvaluator(ast.NodeVisitor):
    def __init__(self, context: dict[str, Any]) -> None:
        self._context = context

    def visit(self, node: ast.AST) -> Any:
        if isinstance(node, ast.Expression):
            return self.visit(node.body)
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Name):
            if node.id not in self._context:
                msg = f"Unknown variable: {node.id}"
                raise RuleEngineError(msg)
            return self._context[node.id]
        if isinstance(node, ast.BoolOp):
            values = [self.visit(value) for value in node.values]
            if isinstance(node.op, ast.And):
                return all(values)
            return any(values)
        if isinstance(node, ast.Compare):
            left = self.visit(node.left)
            for op, comparator in zip(node.ops, node.comparators, strict=True):
                right = self.visit(comparator)
                if not ALLOWED_OPERATORS[type(op)](left, right):
                    return False
                left = right
            return True
        if isinstance(node, ast.BinOp):
            left = self.visit(node.left)
            right = self.visit(node.right)
            return ALLOWED_OPERATORS[type(node.op)](left, right)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            return not self.visit(node.operand)
        msg = f"Unsupported expression: {type(node).__name__}"
        raise RuleEngineError(msg)


def evaluate_formula(expression: str, context: dict[str, Any]) -> Any:
    tree = ast.parse(expression, mode="eval")
    return FormulaEvaluator(context).visit(tree)
