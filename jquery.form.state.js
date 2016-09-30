/* globals, jQuery, $, console */

(function(jQuery) {
    'use strict';

    jQuery.fn.deserialize = function(data) {
        var f = jQuery(this), map = {};
        //Get map of values
        jQuery.each(data.split('&'), function() {
            var nv = this.split('='),
                n = decodeURIComponent(nv[0]),
                v = nv.length > 1 ? decodeURIComponent(nv[1]) : null;
            if (v) {
                v = v.replace(/\+/g, ' ');
            }
            if (!(n in map)) {
                map[n] = [];
            }
            map[n].push(v);
        });
        //Set values for all form elements in the data
        jQuery.each(map, function(n, v) {
            var $els = f.find("[name='" + n + "']");
            // XXX how to handle the case when there are multiple
            //     values with same key?
            //     And one of them is a file and second one is hidden, O_o
            //     so we can't just set the same value to all of them, bc
            //     value setting on file field fails
            $els.each(function(i, el) {
                var $el = $(el);
                if ($el.attr('type') === 'radio') {
                    if (v.indexOf(el.value) !== -1) {
                        $el.prop('checked', true).attr('checked', 'checked');
                    } else {
                        $el.prop('checked', false).removeAttr('checked');
                    }
                } else if (!$el.val() && $el.attr('type') != 'file') {
                    if ($el.prop('tagName') === 'SELECT') {
                        $el.find('option').prop('selected', false)
                                          .removeAttr('selected')
                                          .filter(function(i,x) { return v.indexOf(x.value) !== -1; })
                                          .prop('selected', true)
                                          .attr('selected', 'selected');
                    } else {
                        $el.val(v).trigger('insert');
                    }
                }
            });
        });
        //Uncheck checkboxes and radio buttons not in the form data
        jQuery('input:checkbox:checked,input:radio:checked').each(function() {
            if (!($(this).attr('name') in map)) {
                this.checked = false;
            }
        });

        return this;
    };
})(jQuery);

(function() {
    'use strict';

    var prefix = 'formstate';

    function FormState(element, options) {
        this.$element = $(element);
        this.options = options || {};
        if (options.storeData !== false) {
            this.bindEvents();
        }
        if (options.restore !== false) {
            this.restore();
        }
    }

    FormState.prototype.storage = function() {
        if (window.sessionStorage) {
            return sessionStorage;
        }
        // Only session storage for now.
        //if (window.localStorage) {
        //    return localStorage;
        //}
    };

    FormState.prototype.bindEvents = function() {
        this.$element.bind('change', this.onChange.bind(this));
        this.$element.bind('keyup', this.onKeyUp.bind(this));
        this.$element.bind('paste', this.onPaste.bind(this));
        this.$element.bind('reset', this.clear.bind(this));
    };

    FormState.prototype.onChange = function() {
        this.store();
    };

    FormState.prototype.onKeyUp = function() {
        this.store();
    };

    FormState.prototype.onPaste = function() {
        this.store();
    };

    FormState.prototype.store = function() {
        var key = this.getKey();
        console.debug('Should store the form.');
        var storage = this.storage();
        if (storage) {
            storage.setItem(key, JSON.stringify(this.$element.serialize()));
        }
    };

    FormState.prototype.restore = function() {
        var key = this.getKey();
        var data;
        console.debug('Should restore the form.');
        var storage = this.storage();
        if (storage) {
            data = $.parseJSON(storage.getItem(key));
            console.debug(key, data);
            if (data) {
                this.$element.data('formstate-restored', true);
                this.$element.deserialize(data);
            }
        }
    };

    FormState.prototype.getKey = function() {
        this.key = this.options.name || this.$element.attr('name') || this.$element.attr('id');
        if (!this.key) {
            var className = this.$element.attr('class');
            if (typeof className === 'string') {
                this.key = className.replace(/ /g, '-');
            }
        }
        return prefix + '-' + this.key;
    };

    FormState.prototype.clear = function() {
        var key = this.getKey();
        console.debug('Should clear form storage.');
        var storage = this.storage();
        if (storage) {
            storage.removeItem(key);
        }
    };

    $.fn.formstate = function(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('formstate');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('formstate', (data = new FormState(this, options)));
            }
        });
    };
})();
