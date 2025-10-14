document.querySelectorAll('select[data-value]').forEach(function (select) {
    const val = select.getAttribute('data-value');
    if (val) {
        const match = Array.from(select.options).find(opt => opt.value.toLowerCase() === val.toLowerCase());
        if (match) select.value = match.value;
    }
});
function toggleUserData(mode) {
    const fields = document.querySelectorAll('.user-data input, .user-data select, .user-data textarea');
    const shouldDisable = mode === 'lock';

    fields.forEach(field => {
        field.disabled = shouldDisable;
    });
}
toggleUserData('lock');