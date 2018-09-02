$(document).ready(function () {
// Play Button
    $("#btn_takeFlag").click(function () {
        var counter = 180;
        setInterval(function () {
            counter--;
            if (counter >= 0) {
                span = $("time").text();
                span.innerHTML = counter;

            }
        }, 1000);
    });

//  form user
    $(".change_userinfo").click(function () {
        $('.form_edituser').show()
    });
    $(".close_formuser").click(function () {
        $('.form_edituser').hide()
    })
});