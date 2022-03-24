<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LiveZilla Analytics</title>
    <link rel="shortcut icon" href="./images/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" type="text/css" href="./mobile/css/livezilla6.css<!--acid-->">
    <link rel="stylesheet" type="text/css" href="./_lib/trdp/c3/c3.min.css<!--acid-->">
    <link rel="stylesheet" type="text/css" href="./templates/style_analytics.css<!--acid-->">
    <link rel="stylesheet" href="fonts/font-awesome.min.css">
    <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
    <script src="./_lib/trdp/d3/d3.min.js<!--acid-->"></script>
    <script src="./_lib/trdp/d3/d3-scale-chromatic.min.js<!--acid-->"></script>
    <script type="text/javascript" src="./mobile/js/jquery-3.4.1.min.js"></script>
    <script type="text/javascript" src="./mobile/js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./mobile/js/jquery-migrate-3.1.0.min.js"></script>
    <script type="text/javascript" src="./mobile/js/lzm/classes/ChatCountries.js<!--acid-->"></script>
    <script src="./_lib/trdp/daterangepicker/moment/moment-with-locales.js<!--acid-->"></script>
    <script src="./_lib/trdp/daterangepicker/moment-range/moment-range.js<!--acid-->"></script>
    <link rel="stylesheet" type="text/css" href="./_lib/trdp/daterangepicker/daterangepicker.min.css<!--acid-->">
    <script src="./_lib/trdp/daterangepicker/jquery.daterangepicker.min.js<!--acid-->"></script>
    <script type="text/javascript" src="./templates/ahgzixd7/analytics.js<!--acid-->"></script>
    <link rel="shortcut icon" href="./images/favicon.ico" type="image/x-icon">
    <script src="./_lib/trdp/konva/konva.min.js<!--acid-->"></script>
    <script src="./_lib/trdp/xlsx/xlsx.full.min.js<!--acid-->"></script>
    <script src="./_lib/trdp/c3/c3.js<!--acid-->"></script>
</head>
<body>
    <!--<div id="colors" style="display: none;"></div>-->
    <div id="center-loader" style="display:flex">
        <div id="center-loader-text"></div>
        <div id="loader" class="loader"></div>
    </div>
    <div id="page-grid" style="display:none;">
        <div id="analytics-headline" class="print">
            <div id="left-button-list" class="lzm-tabs-row"></div>
            <div id="right-button-list" class="lzm-tabs-row"></div>
        </div>
        <div id="content" class="print">
            <div id="selector" class="lzm-unselectable" style="display: none;">
                <input id="daterangepicker" type="text"/>
                <div id="date-range-picker-container"></div>
            </div>
            <div id="reports"></div>
        </div>
        <script>
            window['moment-range'].extendMoment(moment);
            moment.locale([navigator.language, 'en']);
            var from = parseInt("<!--from-->");
            var to = parseInt("<!--to-->");
            var initialRange = moment.range(
                moment.unix(from),
                moment.unix(to)
            );

            function capitalizeFirst(string){
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            //console.log('tpl init range');
            //console.log(parseInt("<!--year-->"));
            var tid = {
                overview: '<!--lang_stats_overview-->',
                chats: '<!--lang_stats_chats-->',
                tickets: '<!--lang_stats_tickets-->',
                visitors: '<!--lang_stats_visitors-->',
                visits: '<!--lang_stats_visits-->',
                absolute: '<!--lang_stats_absolute-->',
                relative: '<!--lang_stats_relative-->',
                languages: '<!--lang_stats_languages-->',
                language: '<!--lang_stats_language-->',
                countries: '<!--lang_stats_countries-->',
                country: '<!--lang_stats_country-->',
                cities: '<!--lang_stats_cities-->',
                city: '<!--lang_stats_city-->',
                operators: '<!--lang_stats_operators-->',
                events: '<!--lang_stats_events-->',
                group: '<!--lang_stats_group-->',
                operator: '<!--lang_stats_operator-->',
                event: '<!--lang_stats_event-->',
                feedbacks: '<!--lang_stats_feedbacks-->',
                feedback: '<!--lang_client_feedback-->',
                by_hours: '<!--lang_stats_by_hours-->',
                by_days: '<!--lang_stats_by_days-->',
                by_weeks: '<!--lang_stats_by_weeks-->',
                by_months: '<!--lang_stats_by_months-->',
                by_years: '<!--lang_stats_by_years-->',
                by_quarters: '<!--lang_stats_by_quarters-->',
                by_groups: '<!--lang_stats_by_groups-->',
                by_goals: '<!--lang_stats_by_goals-->',
                by_events: '<!--lang_stats_by_events-->',
                availability: '<!--lang_stats_availability-->',
                operator_availability: '<!--lang_stats_operator_availability-->',
                groups: '<!--lang_stats_groups-->',
                target_availability: '<!--lang_stats_target_availability-->',
                tops: '<!--lang_client_tops-->',
                pages: '<!--lang_stats_pages-->',
                page: '<!--lang_stats_page-->',
                entrance_pages: '<!--lang_stats_entrance_pages-->',
                exit_pages: '<!--lang_stats_exit_pages-->',
                email: '<!--lang_client_your_email-->',
                twitter: '<!--lang_client_wm_s_twitter-->',
                facebook: '<!--lang_client_wm_s_facebook-->',
                device: '<!--lang_stats_device-->',
                devices: '<!--lang_stats_devices-->',
                tablet: '<!--lang_stats_tablet-->',
                mobile: '<!--lang_stats_mobile-->',
                desktop: '<!--lang_stats_desktop-->',
                knowledgebase: '<!--lang_client_tab_knowledgebase-->',
                ticket_response_time: '<!--lang_stats_ticket_response_time-->',
                ticket_resolve_time: '<!--lang_stats_ticket_resolve_time-->',
                accepted: '<!--lang_stats_accepted-->',
                declined: '<!--lang_stats_declined-->',
                missed: '<!--lang_stats_missed-->',
                chat_duration: '<!--lang_stats_chat_average_time-->',
                chat_waiting_time: '<!--lang_stats_chat_average_waiting_time-->',
                new: capitalizeFirst('<!--lang_stats_new-->'),
                recurring: capitalizeFirst('<!--lang_stats_recurring-->'),
                page_impressions: '<!--lang_stats_page_impressions-->',
                browser_instances: '<!--lang_stats_browser_instances-->',
                browsers: '<!--lang_stats_browsers-->',
                browser: '<!--lang_stats_browser-->',
                regions: '<!--lang_stats_regions-->',
                region: '<!--lang_stats_region-->',
                resolutions: '<!--lang_stats_resolutions-->',
                resolution: '<!--lang_stats_resolution-->',
                goals: '<!--lang_stats_goals-->',
                conversions: '<!--lang_stats_conversions-->',
                bounces: '<!--lang_stats_bounces-->',
                ratio_new_visitors: '<!--lang_stats_ratio_new_visitors-->',
                new_tickets: '<!--lang_stats_new_tickets-->',
                converted: '<!--lang_stats_converted-->',
                in_progress: '<!--lang_ticket_status_1-->',
                closed: '<!--lang_ticket_status_2-->',
                deleted: '<!--lang_ticket_status_3-->',
                pending: '<!--lang_ticket_status_4-->',
                pages_per_visitor: '<!--lang_stats_pages_per_visitor-->',
                browser_instances_per_visitor: '<!--lang_stats_browser_instances_per_visitor-->',
                bounce_rate: '<!--lang_stats_bounce_rate-->',
                quarter: '<!--lang_stats_quarter-->',
                today: '<!--lang_stats_today-->',
                yesterday: '<!--lang_stats_yesterday-->',
                this_week: '<!--lang_stats_this_week-->',
                this_month: '<!--lang_stats_this_month-->',
                this_year: '<!--lang_stats_this_year-->',
                last_week: '<!--lang_stats_last_week-->',
                last_month: '<!--lang_stats_last_month-->',
                last_year: '<!--lang_stats_last_year-->',
                last_two_years: '<!--lang_stats_last_two_years-->',
                last_three_years: '<!--lang_stats_last_three_years-->',
                week_of: '<!--lang_stats_week_of-->',
                total: '<!--lang_stats_total-->',
                unknown: '<!--lang_stats_unknown-->',
                generating_print_data: '<!--lang_stats_generating_print_data-->',
                generating_export_data: '<!--lang_stats_generating_export_data-->',
                goals_reached: '<!--lang_stats_goals_reached-->',
                rating: '<!--lang_stats_rating-->',
                systems: '<!--lang_stats_systems-->',
                system: '<!--lang_stats_system-->',
                details: '<!--lang_mobile_details-->',
                chat_tags: '<!--lang_stats_chat_tags-->',
                ticket_tags: '<!--lang_stats_ticket_tags-->',
                tag: '<!--lang_stats_tag-->',
                traffic_sources: '<!--lang_stats_traffic_sources-->',
                sources: '<!--lang_stats_sources-->',
                incoming_messages: '<!--lang_stats_incoming_messages-->',
                incoming: '<!--lang_stats_incoming-->',
                outgoing: '<!--lang_stats_outgoing-->',
                converted: '<!--lang_stats_converted-->',
                outgoing_messages: '<!--lang_stats_outgoing_messages-->',
                resolves: '<!--lang_stats_resolved_tickets-->',
                search_phrases: '<!--lang_stats_search_phrases-->',
                search_phrase: '<!--lang_stats_search_phrase-->',
                search_engines: '<!--lang_stats_search_engines-->',
                search_engine: '<!--lang_stats_search_engine-->',
                views: '<!--lang_stats_views-->',
                amount: '<!--lang_stats_amount-->',
                others: '<!--lang_stats_others-->',
                show_more: '<!--lang_stats_show_more-->',
                crawlers: '<!--lang_stats_crawlers-->',
                crawler: '<!--lang_stats_crawler-->',
                referrers: '<!--lang_stats_referrers-->',
                referrer: '<!--lang_stats_referrer-->',
                domains: '<!--lang_stats_domains-->',
                direct_access: '<!--lang_stats_direct_access-->',
                domain: '<!--lang_stats_domain-->',
                average_time_on_site: '<!--lang_stats_average_time_on_site-->',
                average_time_on_page: '<!--lang_stats_average_time_on_page-->',
                highest_rated: '<!--lang_stats_highest_rated-->',
                lowest_rated: '<!--lang_stats_lowest_rated-->',
                time_on_page: '<!--lang_stats_time_on_page-->',
                misc: window.parent.tid("misc"),
                web: window.parent.tid("web"),
                chat: window.parent.tid("chat"),
                phone: window.parent.tid("phone"),
                ticket_close_time: '<!--lang_stats_ticket_close_time-->',
                tickets_closed_overdue: '<!--lang_stats_tickets_closed_overdue-->',
                <!--feedback_criteria-->
            };
            tid.months = [
                '-',
                '<!--lang_stats_month_january-->',
                '<!--lang_stats_month_february-->',
                '<!--lang_stats_month_march-->',
                '<!--lang_stats_month_april-->',
                '<!--lang_stats_month_may-->',
                '<!--lang_stats_month_june-->',
                '<!--lang_stats_month_july-->',
                '<!--lang_stats_month_august-->',
                '<!--lang_stats_month_september-->',
                '<!--lang_stats_month_october-->',
                '<!--lang_stats_month_november-->',
                '<!--lang_stats_month_december-->'
            ];
            tid.weekdays = [
                '<!--lang_stats_day_sunday-->',
                '<!--lang_stats_day_monday-->',
                '<!--lang_stats_day_tuesday-->',
                '<!--lang_stats_day_wednesday-->',
                '<!--lang_stats_day_thursday-->',
                '<!--lang_stats_day_friday-->',
                '<!--lang_stats_day_saturday-->'
            ];
        </script>
        <div style="clear: both;"></div>

    </div>
</body>
</html>