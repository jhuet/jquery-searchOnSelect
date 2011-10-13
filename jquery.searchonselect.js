/**
 * Hides or shows the options of 1 or more select element(s) depending if they
 * match or not what is typed in an input field.
 *
 * Requires doTimeout plugin :
 * http://benalman.com/projects/jquery-dotimeout-plugin/
 *
 * Usage : $('#input').searchOnSelect($('#select1,#select2'));
 *
 * @author jhuet
 */
(function($) {

    var statics = {
        version: '1.0.0',
        dependencies: {
            loaded : false,
            queried : false,
            inputsToLoad : []
        },
        options : {
            autoSearch: true,
            // Willing to use http://github.com/cowboy/jquery-dotimeout/raw/v1.0/jquery.ba-dotimeout.min.js
            // but GitHub serves all raw files with text/plain Content-Type wich causes problems with IE.
            doTimeoutUrl : 'http://benalman.com/code/projects/jquery-dotimeout/jquery.ba-dotimeout.js',
            flags: 'i',
            loadDependencies: true,
            prePatternFormat: function(pattern) {
                return pattern;
            },
            preSearchFormat: function(search) {
                return search;
            },
            strict: false,
            type: 'and'
        }
    };

    var methods = {

        /**
         * @param $select mixed : The select element(s) to search in
         * @param options array : the options (see statics.options)
         */
        init : function($select, options) {
            options = $.extend({}, statics.options, options);
            if (typeof $select == 'string') {
                $select = $('select#' + $select);
            }
            if ($select.length == 0) {
                $.error('HTML select "' + $select.attr('id') + '" does not exist.');
                return;
            }

            if (options.loadDependencies == false) {
                statics.dependencies.loaded  = true;
                statics.dependencies.queried = true;
            }

            return this.each(function() {
                var $input = $(this);

                if (options.autoSearch == true && $input.val() && $input.val().trim()) {
                    $input.bind('loaded', function(){$(this).keyup()});
                }

                if (statics.dependencies.queried == false) {
                    $.getScript(options.doTimeoutUrl, function() {
                        statics.dependencies.loaded = true;
                        setLoaded();
                    } );
                    statics.dependencies.queried = true;
                }

                // Keep it always at the original size even if all options are hidden
                $select.css('width', $select.innerWidth());
                $select.css('height', $select.innerHeight());

                // Select the content of the input on focus
                $input.focus(function() {
                    $input.select();
                } );

                $input.keyup(function() {
                    // Only search if dependencies are loaded
                    if (statics.dependencies.loaded == true) {
                        // Only do the following code if nothing happens after 250ms after the last keyup
                        $input.doTimeout('searched.searchonselect', 250, function() {
                            var pattern = $(this).val().trim();

                            if (options.strict == false) {
                                search($select, pattern, options);
                            } else {
                                strictSearch($select, pattern, options);
                            }

                            $input.trigger('searched');
                            $select.trigger('searched');
                        } );
                    }
                } );

                if (statics.dependencies.loaded == false) {
                    stackInputsToLoad($input);
                } else {
                    setLoaded($input);
                }
            } );
        },

        options: function(options) {
            $.extend(statics.options, options);
        }
    };

    var stackInputsToLoad = function($input) {
        statics.dependencies.inputsToLoad.push($input);
    };

    var setLoaded = function($input) {
        if (!$input) {
            $.each(statics.dependencies.inputsToLoad, function() {
                this.trigger('loaded');
            } );
        } else {
            $input.trigger('loaded');
        }
    };

    var strictSearch = function($select, pattern, options) {
        // Cycling thru all options for matching patterns
        $select.find('option, optgroup').each(function() {
            var $option = $(this);
            var search = $option.is('option') ? $option.text() + ' ' + $option.parents('optgroup').attr('label') : $option.attr('label');

            if (search.search(new RegExp(pattern, options.flags)) == -1) {
                hideOption($option);
            } else {
                showOption($option);
            }
        } );
    };

    var search = function($select, pattern, options) {
        var patterns = pattern.split(' ');
        $.each(patterns, function(idxp, patt) {
            patterns[idxp] = options.prePatternFormat(patt);
        } );

        // Cycling thru all options for matching patterns
        $select.find('option, optgroup').each(function() {
            var found = options.type == 'and' ? true : false;
            var $option = $(this);
            var search = $option.is('option') ? $option.text() + ' ' + $option.parents('optgroup').attr('label') : $option.attr('label');
            search = options.preSearchFormat(search);

            $.each(patterns, function(idx, pattern) {
                if (search.search(new RegExp(pattern, options.flags)) != -1) {
                    if (options.type == 'or') {
                        found = true;
                        return false;
                    }
                } else {
                    if (options.type == 'and') {
                        found = false;
                        return false;
                    }
                }
            } );

            if (found == false) {
                hideOption($option);
            } else {
                showOption($option);
            }
        } );
    };

    var showOption = function($option) {
        $option.show();
        if ($option.parent('span')) {
            $option.parent('span').replaceWith($option);
        }
        if ($option.is('option')) {
            showOptgroupOf($option);
        }
    };

    var hideOption = function($option) {
        if (!$($option).parent().is('span')) {
            $option.attr('selected', false)
                   .wrap('<span>') // Hack to be able to hide option on all browsers
//                       .parent('span')
                   .hide();
        }
    };

    var showOptgroupOf = function($option) {
        showOption($option.parents('optgroup'));
    };

    $.fn.searchOnSelect = function() {
        return methods.init.apply(this, arguments);
    };

    $.searchOnSelect = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        methods.options.apply(this, arguments);
    };

})(jQuery);