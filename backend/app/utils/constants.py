MONTHS_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


def effective_installment_status(inst, today=None):
    from datetime import date as date_cls
    today = today or date_cls.today()
    if inst.paid_date or getattr(inst, 'status', None) == 'paid':
        return 'paid'
    if getattr(inst, 'status', None) == 'cancelled':
        return 'cancelled'
    if inst.due_date and inst.due_date < today:
        return 'overdue'
    return 'pending'
