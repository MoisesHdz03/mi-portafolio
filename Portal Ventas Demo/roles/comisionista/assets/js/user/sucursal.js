/*==========================================================
    CONSULTA DE SUCURSAL (jQuery)
==========================================================*/
$(document).ready(function () {

    $('#NumeroSucursal').on('change', function () {

        let numero = $(this).val().trim();

        // Si el campo está vacío
        if (numero === '') {
            $('#Sucursal').val('');
            return;
        }

        $.ajax({
            url: 'buscar_sucursal.php',
            type: 'POST',
            dataType: 'json',
            data: {
                NumeroSucursal: numero
            },

            success: function (response) {

                if (response.success) {

                    // Sucursal encontrada y activa
                    $('#Sucursal').val(response.nombre);

                } else {

                    // Limpiar el campo
                    $('#NumeroSucursal').val('');
                    $('#Sucursal').val('');

                    // Regresar al campo
                    $('#NumeroSucursal').focus();

                    // Validar el tipo de error
                    if (response.tipo === 'deshabilitada') {
                        alert('La sucursal está deshabilitada.');
                    } else {
                        alert('La sucursal no existe.');
                    }
                }
            },

            error: function (xhr, status, error) {

                $('#Sucursal').val('');

                console.log('Status:', status);
                console.log('Error:', error);
                console.log('Respuesta:', xhr.responseText);

                alert('Error al consultar la sucursal.');
            }
        });
    });
});

/*----------------------------------------------------------
    NOTA: este segundo manejador ya existía en user-script.js.
    Se conserva para que el comportamiento sea idéntico al
    anterior (2 consultas y, si falla, 2 alertas).
    Para dejar una sola consulta basta con borrar este bloque.
----------------------------------------------------------*/
$(document).ready(function () {

    console.log('DOCUMENT READY');

    $('#NumeroSucursal').on('change', function () {

        console.log('EVENTO CHANGE');

        let numero = $(this).val().trim();

        console.log('Número capturado:', numero);

        // Si el campo está vacío
        if (numero === '') {
            console.log('Campo vacío');
            $('#Sucursal').val('');
            return;
        }

        console.log('Enviando AJAX...');

        $.ajax({
            url: 'buscar_sucursal.php',
            type: 'POST',
            dataType: 'json',
            data: {
                NumeroSucursal: numero
            },

            beforeSend: function () {
                console.log('AJAX beforeSend');
            },

            success: function (response) {

                console.log('AJAX success');
                console.log(response);

                if (response.success) {

                    console.log('Sucursal encontrada');

                    $('#Sucursal').val(response.nombre);

                } else {

                    console.log('Sucursal no válida');

                    $('#NumeroSucursal').val('');
                    $('#Sucursal').val('');
                    $('#NumeroSucursal').focus();

                    if (response.tipo === 'deshabilitada') {
                        alert('La sucursal está deshabilitada.');
                    } else {
                        alert('La sucursal no existe.');
                    }
                }
            },

            error: function (xhr, status, error) {

                console.log('AJAX error');
                console.log('Status:', status);
                console.log('Error:', error);
                console.log('Respuesta:', xhr.responseText);

                $('#Sucursal').val('');

                alert('Error al consultar la sucursal.');
            }
        });
    });
});