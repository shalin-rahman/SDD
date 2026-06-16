"""Unit tests for formula rule engine (safe AST evaluator)."""

import pytest

from emcap.rules.engine import RuleEngineError, evaluate_formula


def test_evaluate_formula_comparison_and_boolean() -> None:
    assert evaluate_formula("amount > 100 and active == True", {"amount": 150, "active": True}) is True
    assert evaluate_formula("amount > 100 and active == True", {"amount": 50, "active": True}) is False


def test_evaluate_formula_arithmetic_and_not() -> None:
    assert evaluate_formula("10 + 5", {}) == 15
    assert evaluate_formula("not False", {}) is True


def test_evaluate_formula_chained_comparison() -> None:
    assert evaluate_formula("1 < 2 < 3", {}) is True
    assert evaluate_formula("3 < 2 < 1", {}) is False


def test_evaluate_formula_unknown_variable_raises() -> None:
    with pytest.raises(RuleEngineError, match="Unknown variable"):
        evaluate_formula("missing > 1", {})


def test_evaluate_formula_unsupported_node_raises() -> None:
    with pytest.raises(RuleEngineError, match="Unsupported expression"):
        evaluate_formula("lambda: 1", {})
