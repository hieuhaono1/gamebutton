$(document).ready(function () {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    // var $currentInput = $usernameInput.focus();

    var socket = io();

    const addParticipantsMessage = (data) => {
        var message = '';
        if (data.numUsers === 1) {
            message += "Có 1 người đang online";
        } else {
            message += "Hiện có " + data.numUsers + " người trong phòng";
        }
        log(message);
    }

    // Sets the client's username
    const setUsername = () => {
        username = cleanInput($usernameInput.val().trim());

        // If the username is valid
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            // $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('add user', username);
        }
    }

    // Sends a chat message
    const sendMessage = () => {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            console.log(message);
            $inputMessage.val('');

            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }

    // Log a message
    const log = (message, options) => {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    const addChatMessage = (data, options) => {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<img src="img/default-avatar.png" style="width: 29px;height: 29px;border-radius: 50%;margin-right: 10px;"><span class="username"/>')
            .text(data.username + ' :')
            .css('color', getUsernameColor(data.username));

        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);


    }

    // Adds the visual chat typing message
    // const addChatTyping = (data) => {
    //   data.typing = true;
    //   data.message = 'is typing';
    //   addChatMessage(data);
    // }

    // Removes the visual chat typing message
    // const removeChatTyping = (data) => {
    //   getTypingMessages(data).fadeOut(() => {
    //     $(this).remove();
    //   });
    // }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    const addMessageElement = (el, options) => {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    const cleanInput = (input) => {
        return $('<div/>').text(input).html();
    }

    // Updates the typing event
    const updateTyping = () => {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(() => {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    const getTypingMessages = (data) => {
        return $('.typing.message').filter(i => {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    const getUsernameColor = (username) => {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    // $window.keydown(event => {
    //     // Auto-focus the current input when a key is typed
    //     // if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    //     //     $currentInput.focus();
    //     // }
    //     // When the client hits ENTER on their keyboard
    //     if (event.which === 13) {
    //         if (username) {
    //             sendMessage();
    //             socket.emit('stop typing');
    //             typing = false;
    //         } else {
    //             setUsername();
    //         }
    //     }
    // });

    $inputMessage.on('input', () => {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    // $loginPage.click(() => {
    // $currentInput.focus();
    // });

    // Focus input when clicking on the message input's border
    // $inputMessage.click(() => {
    //     $inputMessage.focus();
    // });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', (data) => {
        connected = true;
        // Display the welcome message
        var message = "Chào mừng đến với kênh chat Game.tintuc.vn – ";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
        loadLogChatHistory();
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', (data) => {

        insertMessageToData(data.username, data.message);
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', (data) => {
        log(data.username + ' Đã tham gia phòng');

        addParticipantsMessage(data);


    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', (data) => {
        log(data.username + ' Đã rời phòng');
        addParticipantsMessage(data);
        // removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    // socket.on('typing', (data) => {
    //   addChatTyping(data);
    // });

    // Whenever the server emits 'stop typing', kill the typing message
    // socket.on('stop typing', (data) => {
    //   removeChatTyping(data);
    // });

    socket.on('disconnect', () => {
        log('Bạn đã kết nối với kênh chat');
    });

    socket.on('reconnect', () => {
        log('Bạn đã được kết nối lại');
        if (username) {
            socket.emit('add user', username);
        }
    });

    socket.on('reconnect_error', () => {
        log('Kết nối lại thất bại');
    });

    var number = Math.floor(Math.random() * 20) + 1;
    // handle play Button
    $('#btn_takeFlag').on('click', function (e) {
        e.preventDefault();
        $(this).prop('disabled', true);




        axios.get('https://cmsgame.tintuc.vn/api/insertPlayHistory',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
                params: {
                    id_member: number
                }
            }
        )
            .then(function (response) {
                if (response.data.err !== "1") {

                    // add Nofication
                    var taken_from = response.data.taken_from;
                    var time_take = response.data.time_take;

                    $('.empty_nofication').css('display', 'none');
                    $('.notification').css('display', 'block');
                    $('.notification_content').prepend("<li class='success_nofication'><i class='fa fa-bell-o' aria-hidden='true'></i>Chúc Mừng bạn đã đoạt big time từ " + taken_from + " vào lúc <span class='time_taken'> " + time_take + " s </span></li>");

                    $.notify({
                        title: '<strong>Success</strong>',
                        icon: 'glyphicon glyphicon-star',
                        message: response.data.message + '!'
                    }, {
                        type: 'success',
                        animate: {
                            enter: 'animated fadeInUp',
                            exit: 'animated fadeOutRight'
                        },
                        placement: {
                            from: "bottom",
                            align: "left"
                        },
                        offset: 20,
                        spacing: 10,
                        z_index: 1031,
                    });


                } else {
                    $.notify({
                        title: '<strong>Failed</strong>',
                        icon: 'glyphicon glyphicon-star',
                        message: response.data.message + '!'
                    }, {
                        type: 'danger',
                        animate: {
                            enter: 'animated fadeInUp',
                            exit: 'animated fadeOutRight'
                        },
                        placement: {
                            from: "bottom",
                            align: "left"
                        },
                        offset: 20,
                        spacing: 10,
                        z_index: 1031,
                    });

                    $('.empty_nofication').css('display', 'none');
                    $('.notification').css('display', 'block');
                    $('.notification_content').prepend("<li class='failed_nofication'><i class='fa fa-bell-o' aria-hidden='true'></i>Thất bại " + response.data.message + "</li>");
                }
            })
            .catch(function (error) {
                $.notify({
                    title: '<strong>Failed</strong>',
                    icon: 'glyphicon glyphicon-star',
                    message: error.data.message + '!'
                }, {
                    type: 'danger',
                    animate: {
                        enter: 'animated fadeInUp',
                        exit: 'animated fadeOutRight'
                    },
                    placement: {
                        from: "bottom",
                        align: "left"
                    },
                    offset: 20,
                    spacing: 10,
                    z_index: 1031,
                });
            });
    });

    // Kiểm tra số lượt chơi mỗi 5s
    function getInfoMember() {

        axios.get('https://cmsgame.tintuc.vn/api/getPlayerInfo',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
                params: {
                    id_member: number
                }
            }
        )
            .then(function (response) {
                if (response.data.err === '0') {
                    if (response.data.dataMember.play_left !== null) {
                        $('.play_left').text(response.data.dataMember.play_left);
                    } else {
                        $('.play_left').text('0');
                    }

                    if (response.data.dataMember.picture !== null) {
                        $('.avata_player').attr('src', response.data.dataMember.picture);
                    } else {
                        $('.avata_player').attr('src', 'img/default-avatar.png');
                    }


                    if (response.data.memberPlayedTurn !== null) {
                        $('.has_left').text(response.data.memberPlayedTurn);
                    } else {
                        $('.has_left').text('0');
                    }

                    if (response.data.highestScore !== null) {
                        $('.highest').text(response.data.highestScore);
                    } else {
                        $('.highest').text('0');
                    }

                    if (response.data.dataMember.name !== null) {
                        $('.player_name').text(response.data.dataMember.name);
                    } else {
                        $('.player_name').text('User Member');
                    }

                    var timeLeft = response.data.time_left;
                    if (timeLeft > 0) {
                        $('#btn_takeFlag').prop('disabled', true);
                    } else {
                        $('#btn_takeFlag').prop('disabled', false);

                    }

                    if (response.data.dataMember.play_bonus !== null) {
                        $('.number_avaible_exchange').val('Còn ' + response.data.dataMember.play_bonus + ' lượt');
                    } else {
                        $('.number_avaible_exchange').val('Còn 0 lượt');
                    }

                    $('.btn_exchange_play_turn').attr('data-id', response.data.dataMember.id)
                }
            })
            .catch(function (error) {

                console.log(error);
            });
    }

    setInterval(getInfoMember, 5000);

    // kiểm tra lịch sử chơi và đẩy về thông báo
    function getLogHistoryAndPushNofication() {

        axios.get('https://cmsgame.tintuc.vn/api/getStatusTop',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
                params: {
                    id_member: number
                }
            }
        )
            .then(function (response) {
                if (response.data.err == '0') {
                    $('.empty_nofication').css('display', 'none');
                    $('.notification').css('display', 'block');
                    $('.notification_content').prepend("<li class='success_nofication'><i class='fa fa-bell-o' aria-hidden='true'></i><span class='time_taken'>" + reponse.data.message + " s </span> </li>");
                }
            })
            .catch(function (error) {

                // console.log(error);
            });
    }

    setInterval(getLogHistoryAndPushNofication, 5000);

    // Handle Ui UX
    $('.nav-link.icon_bell').on('click', function () {
        $('.notification').css('display', 'none')
    });

    // Insert Data Chat Message
    function insertMessageToData(username, message) {
        axios.get('https://cmsgame.tintuc.vn/api/insertChatMessage',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
                params: {
                    message: message,
                    member_name: username
                }
            }
        )
            .then(function (response) {

            })
            .catch(function (error) {
                console.log('lỗi:' + error);
            });
    }

    // Load log chat Data
    function loadLogChatHistory() {
        axios.get('https://cmsgame.tintuc.vn/api/getChatLogMessage',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},

            }
        )
            .then(function (response) {
                var dataChat = response.data,
                    options = options || {};
                ;
                $.each(dataChat, function (key, value) {

                    var $usernameDiv = $('<img src="img/default-avatar.png" style="width: 29px;height: 29px;border-radius: 50%;margin-right: 10px;"><span class="username"/>')
                        .text(value.Member_name + ' :')
                        .css('color', getUsernameColor(value.Member_name));

                    var $messageBodyDiv = $('<span class="messageBody">')
                        .text(value.message_content);

                    var typingClass = value.typing ? 'typing' : '';

                    var $messageDiv = $('<li class="message"/>')
                        .data('username', value.Member_name)
                        .addClass(typingClass)
                        .append($usernameDiv, $messageBodyDiv);

                    addMessageElement($messageDiv, options);
                })
            })
            .catch(function (error) {
                console.log('lỗi:' + error);
            });
    }

    // Load dashboard Top 10 every 8s
    function loadDashBoardTop10() {
        axios.get('https://cmsgame.tintuc.vn/api/getTop10',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
            }
        )
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log('lỗi:' + error);
            });
    }

    setInterval(loadDashBoardTop10, 8000);

    // Change turn
    $('.btn_change_turn').on('click', function (e) {
        e.preventDefault();

        $('#modal_change_turn').modal('show');

    });

    $('.btn_exchange_play_turn').on('click', function (e) {
        e.preventDefault();
        var id = $(this).attr('data-id');
        var numberChange = $('#insInputPlayTurn').val();
        axios.get('https://cmsgame.tintuc.vn/api/exchangePlayTurn',
            {
                headers: {'crossDomain': true, 'Content-Type': 'application/json'},
                params: {
                    id_member: id,
                    number_exchange: numberChange
                }
            }
        )
            .then(function (response) {
                console.log(response.data.err);
                if (response.data.err !== 1) {
                    $.notify({
                        title: '<strong>Success</strong>',
                        icon: 'glyphicon glyphicon-star',
                        message: response.data.message + '!'
                    }, {
                        type: 'success',
                        animate: {
                            enter: 'animated fadeInUp',
                            exit: 'animated fadeOutRight'
                        },
                        placement: {
                            from: "bottom",
                            align: "left"
                        },
                        offset: 20,
                        spacing: 10,
                        z_index: 1031,
                    });

                    $('#modal_change_turn').modal('hide');
                }else{
                    $.notify({
                        title: '<strong>Failed</strong>',
                        icon: 'glyphicon glyphicon-star',
                        message: response.data.message + '!'
                    }, {
                        type: 'danger',
                        animate: {
                            enter: 'animated fadeInUp',
                            exit: 'animated fadeOutRight'
                        },
                        placement: {
                            from: "bottom",
                            align: "left"
                        },
                        offset: 20,
                        spacing: 10,
                        z_index: 1031,
                    });

                    $('#modal_change_turn').modal('hide');
                }
            })
            .catch(function (error) {
                console.log('lỗi:' + error);
            });
    });
});