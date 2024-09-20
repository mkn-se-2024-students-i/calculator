import regex as re
import math

# TODO: add 'sin', 'cos', 'tan', 'e', 'pi'
_correct_elements_regexp = '([\* \- \+ \/ \d \s \. \^ \( \) \|]*(log)*(sqrt)*)*'

_operation_replacements = [('log', 'math.log'), ('sqrt', 'math.sqrt'), ('^', '**')]

_invalid_string = 'inval'
_invalid_patterns = ['\+\s*\+', '-\s*-', '\*\s*\*', '/\s*/']

def _check_arithmetic_expression(expr: str):
	return re.fullmatch(_correct_elements_regexp, expr)

def _remove_invalid_sequenses(expr: str):
	for pattern in _invalid_patterns:
		expr = re.sub(pattern, _invalid_string, expr)
	return expr


def _change_op_to_python_op(expr: str):
	for (op, py_op) in _operation_replacements:
		expr = expr.replace(op, py_op)
	return expr

def evaluate_expression(expr: str):
	try:
		if (not _check_arithmetic_expression(expr)):
			return ("The given expression contains forbidden symbols", False)
		correct_expr = _change_op_to_python_op(_remove_invalid_sequenses(expr))
		res = eval(correct_expr)
		return (res, True)
	except:
		return ("The given expression is not correct arithmetic expression", False)
