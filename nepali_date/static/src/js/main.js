odoo.define('nepali_date.Calendar', function (require) {
  "use strict";
  console.log("hello niraj")
  var web_fields = require('web.basic_fields');
  var datepicker = require('web.datepicker');
  console.log(datepicker,typeof datepicker);
  var ListRenderer = require('web.ListRenderer');
  // var PivotRenderer = require('web.PivotRenderer');
  var calendarConfig = require('nepali_date.config');
  var field_utils = require('web.field_utils');

  var CALENDAR_LANG = 'en_US';
  var BS_DATE_FORMAT = calendarConfig['date_format'] || 'MM d, yyyy';

  $(function () {

    //NOTE: Close calendars picker while clicking outside of the datepicker input. Required only in Actoin Window/ Modal Popup Window form fields

    $(document).on('click', function (event) {
      if ($(event.target).hasClass('nd_datepicker_input_bs')) {
        return;
      }

      try {
        if ($.calendarsPicker.curInst) {
          $.calendarsPicker.curInst.elem.calendarsPicker('hide');
        }
      } catch (error) {
        //pass
      }
    });
  });

  web_fields.FieldDate.include({
    /**
     * Resets the content to the formated value in readonly mode.
     *
     * @override
     */
    _renderReadonly: function () {
      var bsDate = ad2bs(this.value) || '';
      var value = this._formatValue(this.value) + ' (' + bsDate + ')';
      this.$el.text(value);
    },
  });

  datepicker.DateWidget.include({
    events: _.extend({}, datepicker.DateWidget.prototype.events, {
      'click input.nd_datepicker_input_bs': '_onClickBSInput',
      'click .nd_switch_btn': '_onDatepickerSwitchBtnClick',
    }),

    _onClickBSInput: function (event) {
      event.stopPropagation();
      this.$el.datetimepicker('hide');
      this.$input_bs.select();
    },

    _onDatepickerSwitchBtnClick: function (event) {
      this.set('ad_mode', !this.get('ad_mode'));

      if (this.get('ad_mode') === true) {
        this.$('.nd_datepicker_ad').attr('hidden', false);
        this.$('.nd_datepicker_bs').attr('hidden', 'hidden');
        this.$input_bs.calendarsPicker('hide');
      } else {
        this.$('.nd_datepicker_bs').attr('hidden', false);
        this.$('.nd_datepicker_ad').attr('hidden', 'hidden');
      }
    },

    onBSDateSelect: function ([cdate]) {
      var adDate = this.getValue();
      var formatted = adDate ? this._formatClient(adDate) : null;
      var [, time = false] = (formatted || '').split(' ');
      var value = cdate && moment(cdate.toJSDate()) || false;

      if (value && time) {
        //Retain time value while selecting BS date if time value is present
        var timeMoment = moment(time, 'HH:mm:ss');
        value.set({
          'hour': timeMoment.get('hour'),
          'minute': timeMoment.get('minute'),
          'second': timeMoment.get('second'),
        });
      }

      this.setValue(value);
      this._setValueFromUi();
      this.__libInput++;
      this.changeDatetime();
      this.__libInput--;
    },

    /**
     * @override
     */
    init: function () {
      this._super.apply(this, arguments);
      this.set('ad_mode', calendarConfig['date_mode'] === 'ad');
    },

    /**
     * @override
     */
    start: function () {
      this._super();
      this.$display_ad = this.$('.nd_datepicker_bs .nd_alt_date');
      this.$display_bs = this.$('.nd_datepicker_ad .nd_alt_date');
      this.$input_bs = this.$('input.nd_datepicker_input_bs');
      this.$input_bs.calendarsPicker('destroy');
      this.$input_bs.calendarsPicker({
        showAnim: '',
        prevText: '',
        nextText: '',
        firstDay: 0,
        defaultDate: ad2bs(this.getValue()) || '',
        dateFormat: BS_DATE_FORMAT,
        yearRange: 'c-55:c+5',
        calendar: getBSCalendar(),
        onSelect: this.onBSDateSelect.bind(this),
      });
    },

    /**
     * @override
     * @param {Moment|false} value
     */
    setValue: function (value) {
      this._super(value);
      var bsDate = ad2bs(value, false) || '';

      this.$input_bs.val(bsDate);
      this.$display_ad.text(this._formatClient(value) || '');
      this.$display_bs.text(bsDate);
    },

    /**
     * @override
     */
    focus: function () {
      if (this.get('ad_mode')) {
        return this._super();
      }
      // VVI
    },

    /**
     * @override
     */
    destroy: function () {
      this.__libInput++;
      try {

        this.$input_bs.calendarsPicker('hide');
        this.$input_bs.calendarsPicker('destroy');

      } catch (e) {

        try {
          if ($.calendarsPicker.curInst) {
            $.calendarsPicker.curInst.div.detach();
          }
        } catch (error) {
          //pass
        }

      }
      this.__libInput--;
      this._super.apply(this, arguments);
    },
  });

  ListRenderer.include({

    /**
     * Render a cell for the table. For most cells, we only want to display the
     * formatted value, with some appropriate css class. However, when the
     * node was explicitely defined with a 'widget' attribute, then we
     * instantiate the corresponding widget.
     *
     * @override
     * @param {Object} record
     * @param {Object} node
     * @param {integer} colIndex
     * @param {Object} [options]
     * @param {Object} [options.mode]
     * @param {Object} [options.renderInvisible=false]
     *        force the rendering of invisible cell content
     * @param {Object} [options.renderWidgets=false]
     *        force the rendering of the cell value thanks to a widget
     * @returns {jQueryElement} a <td> element
     */
    _renderBodyCell: function (record, node, colIndex, options) {
      var $cell = this._super.apply(this, arguments);
      var name = node.attrs.name;
      var field = this.state.fields[name];
      var value = record.data[name];

      if (node.tag !== 'field' || ['date', 'datetime'].indexOf(field.type) === -1 || !value) {
        return $cell;
      }

      if (options && options.mode === 'edit' && options.renderWidgets) {
        return $cell;
      }

      var bsDate = ad2bs(value) || '';

      $cell
        .attr('title', $cell.attr('title') + ' (' + bsDate + ')')
        .append(' (' + bsDate + ')');

      return $cell;
    }
  });



  function getBSCalendar(lang) {
    lang = lang || CALENDAR_LANG;
    return $.calendars.instance('nepali', 'en_US');
  }

  function ad2bs(m, timezone, format) {
    timezone = timezone === false ? false : true;
    format = format || BS_DATE_FORMAT;

    if (!m) {
      return false;
    }

    var formatted = field_utils.format.datetime(m, null, { 'timezone': timezone });
    var adDate = field_utils.parse.datetime(formatted, null, { 'timezone': true }).toDate();

    return getBSCalendar().fromJSDate(adDate).formatDate(format);
  }

  return {
    FieldDate: web_fields.FieldDate,
    FieldDateTime: web_fields.FieldDateTime,
    DateWidget: datepicker.DateWidget,
    ListRenderer: ListRenderer,
  };
});
