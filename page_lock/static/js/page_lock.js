$(document).ready(function() {
    // Global values.
    var api_interval = $('#page_lock_api_interval').val();
    var allow_deactivation = true;
    var csrf_token;
    var data_to_process;
    var user_reference;

    // Hide all buttons.
    $('#page_lock_refresh_button').hide();
    $('#page_lock_reload_button').hide();

    // Refresh page by clicking the button.
    $('#page_lock_refresh_button').on('click', function(){
        allow_deactivation = false;
        $(location).attr('href', get_full_url());
    });

    $('#page_lock_reload_button').on('click', function(){
        data_to_process = call_open_page_connection();
        update_page(data_to_process);
    });

    // Get full url of current page.
    var get_full_url = function() {
        return window.location.href;
    }

    // Get base url of current page.
    var get_base_url = function() {
        var full_url = get_full_url();
        var full_url_splitted = full_url.split('/');
        return full_url_splitted[0] + '//' + full_url_splitted[2];
    }

    var redirect_to_homepage = function() {
        var homepage = data_to_process.page_lock_settings.homepage;
        var homepage_url = get_base_url() + homepage
        $(location).attr('href', homepage_url)
    }

    // Ajax function.
    var send_request = function(url, data) {
      var tmp = null;
      $.ajax({
        method: 'POST',
        url: url,
        headers: {
            'X-CSRFToken': csrf_token
        },
        data: JSON.stringify(data),
        dataType: 'json',
        async: false,
        success: function(response) {
            tmp = response;
        }
      })

      return tmp;
    };

    // Get data from template.
    var get_template_data = function() {
        return JSON.parse($('#page_lock_template_data').val());
    };

    var call_api = function(url) {
        var data = {
            'url': get_full_url(),
            'user_reference': user_reference,
        };

        var response = null;
        var num = 0;
        do {
            response = send_request(url, data);
            num++;
            window.setTimeout(function(){}, 500);

        } while (!response && num <= 3);

        //When response is `null` then warn user by dialog and
        // redirect him to the homepage.
        if (!response) {
            redirect_to_homepage();
        }

        return response;
    };

    var call_get_page_info_data = function() {
        var url = get_base_url() + '/page_lock/get_page_info/';

        return call_api(url);
    };

    var call_open_page_connection = function() {
        var url = get_base_url() + '/page_lock/open_page_connection/';

        return call_api(url);
    }

    var update_page = function(data) {
        // Update counter.
        // TODO(vstefka) add message based on API result.
        $('#page_lock_counter_display').text(data.reconnect_in + ' ' + 'seconds');


        // Show `REFRESH BUTTON` when page is not locked.
        if (!data.is_locked) {
            $('#page_lock_refresh_button').show();
        }

        // Show `RELOAD BUTTON` only for user that locks current page.
        if (data.is_locked && user_reference == data.locked_by) {
            $('#page_lock_reload_button').show();
        }

        // Hide `page_lock_block`
        if (data.is_locked && user_reference != data.locked_by) {
            $('.page_lock_block').hide();
        }


        // Redirect to homepage when `reconnect_in` is equal to zero.
        if (data.reconnect_in == 0) {
            redirect_to_homepage();
        }
    }

    var periodical_update = function() {
        if (!data_to_process) {
            // Initialize global values.
            data_to_process = get_template_data();
            csrf_token = data_to_process.page_lock_settings.csrf_token;
            user_reference = data_to_process.page_lock_settings.user_reference;
        } else {
            // Get data from info API.
            data_to_process = call_get_page_info_data();
        }
        update_page(data_to_process);
    }

    // Call `periodical_update` once and then every `api_interval` [ms].
    template_data = get_template_data();

    periodical_update();
    window.process_data_interval = setInterval(periodical_update, api_interval);

    // Deactivate user leaving current page.
    $(window).on('unload', function() {
        // When user click `REFRESH` button then page lock can not deactivate same user refreshing page.
        if (allow_deactivation) {
            var url = get_base_url() + '/page_lock/close_page_connection/';
            var data = {
                'url': get_full_url(),
                'user_reference': user_reference,
            };
            response = send_request(url, data);
            clearInterval(window.process_data_interval);
        }
    });
});
