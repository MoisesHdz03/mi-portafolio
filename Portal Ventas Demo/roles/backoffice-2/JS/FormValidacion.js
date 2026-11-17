document.querySelectorAll('.form-block__title').forEach(function (title) {
    title.addEventListener('click', function () {
        title.parentElement.classList.toggle('is-open');
    });
});