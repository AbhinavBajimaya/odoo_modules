/** @odoo-module **/
import {
  momentToLuxon,
} from "@web/core/l10n/dates";

import { useAutofocus } from "@web/core/utils/hooks";
import { DatePicker as DatePicker } from '@web/core/datepicker/datepicker';
import fieldUtils from 'web.field_utils';
import { patch } from "@web/core/utils/patch";
import {onWillStart,onMounted,onWillUpdateProps,onWillUnmount,useExternalListener,useRef,useState} from "@odoo/owl";
const { DateTime } = luxon;
import { loadJS } from "@web/core/assets";
import { useInputField } from "@web/views/fields/input_field_hook";
const calendarConfig = require('nepali_date.configg');
import { DateTimeField } from '@web/views/fields/datetime/datetime_field';
import { DateField } from '@web/views/fields/date/date_field';
import { areDateEquals, formatDateTime, formatDate } from "@web/core/l10n/dates";
import { localization } from "@web/core/l10n/localization";



// var ListRenderer = require('web.ListRenderer');
// var PivotRenderer = require('web.PivotRenderer');

var CALENDAR_LANG = 'en_US';
var BS_DATE_FORMAT = calendarConfig['date_format'] || 'MM d, yyyy';
let datePickerId = 0;
let datePickerBSId = 1;

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

  var formatted = fieldUtils.format.datetime(m, null, { 'timezone': timezone });
  var adDate = fieldUtils.parse.datetime(formatted, null, { 'timezone': true }).toDate();

  return getBSCalendar().fromJSDate(adDate).formatDate(format);
}


patch(DatePicker.prototype, "prototype patch", {
  setup() {
    this.rootRef = useRef("root");
    this.rootRefAD = useRef("rootRefAD");
    this.inputRef = useRef("input");
    this.rootRefBS = useRef("rootBS");
    this.inputRefBS = useRef("inputBS");
    this.state = useState({ warning: false });
    this.displayRefAD = useRef("displayAD");
    this.displayRefBS = useRef("displayBS");

    this.datePickerId = `o_datepicker_${datePickerId++}`;
    this.datePickerBSId = `o_datepicker_${datePickerBSId++}`;
    // Manually keep track of the "open" state to write the date in the
    // static format just before bootstrap parses it.
    this.datePickerShown = false;
    this.datePickerBSShown=false;
    useInputField({ getValue: () => this.props.value || "", refName: "rootBS" });

    this.initFormat();
    this.setDateAndFormat(this.props);
    onWillStart(() => loadJS('nepali_date/static/src/js/calendar.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.calendars.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.calendars.plus.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.calendars.nepali.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.calendars.nepali-ne.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.plugin.js',
                              'nepali_date/static/lib/jquery.calendars.package-2.1.0/js/jquery.calendars.picker.js',
                                 ));

    useAutofocus();
    useExternalListener(window, "scroll", this.onWindowScroll, { capture: true });

    onMounted(this.onMounted);
    onWillUpdateProps(this.onWillUpdateProps);
    onWillUnmount(this.onWillUnmount);

    // this.inputRefBS.el.value=(ad2bs(moment(formatDateTime(this.date))));
},

onMounted() {
  this.bootstrapDateTimePicker(this.props);
  this.updateInput();

  window.$(this.rootRef.el).on("show.datetimepicker", () => {
      this.datePickerShown = true;
      this.inputRef.el.select();
  });
  window.$(this.rootRef.el).on("hide.datetimepicker", ({date}) => {
      this.datePickerShown = false;
      this.onDateChange({ eventDate: date, useStatic: true });
  });
  window.$(this.rootRef.el).on("error.datetimepicker", () => false);

  $(this.inputRefBS.el).calendarsPicker({
    showAnim: '',
    prevText: '',
    nextText: '',
    firstDay: 0,
    defaultDate: ad2bs(this.value) || '',
    dateFormat: BS_DATE_FORMAT,
    yearRange: 'c-55:c+5',
    calendar: getBSCalendar(),
    onSelect: this.onBSDateSelect.bind(this),
  });
 
  // this.rootRefBS.el.value="";
  try{ 
    this.inputRefBS.el.value=(ad2bs(moment(formatDateTime(this.date)))); 
  }
  catch{}
},

onBSDateSelect: function ([cdate]) {
      var adDate = this.inputRef.el.value;
      console.log(adDate);
      if(adDate!="" && adDate!=null){
        var formatted = adDate ? this.formatValue(this.date) : null;
        var [, time = false] = (formatted[0] || '').split(' ');
      }
      else{
        time=false;
      }
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
      this.setValue(value,time); 
    },

    _onClickBSInput: function (event) {
      event.stopPropagation();
      this.inputRefBS.el.select();
    },

    setValue: function (value,time=false) {
      // this._super(value);
      // var cur_dt=this.formatValue(this.date);
      var bsDate = ad2bs(value) || '';

      this.inputRefBS.el.value=bsDate;
      if (time==false){
        this.inputRef.el.value = value.toDate().toLocaleDateString();
      }
      else{
        console.log(value.toDate().toLocaleTimeString("en-US", { hour12: false }));
        if(value.toDate().toLocaleTimeString("en-US", { hour12: false })!="24:00:00"){
          this.inputRef.el.value = value.toDate().toLocaleDateString() + " " + value.toDate().toLocaleTimeString("en-US", { hour12: false });
        }
        else{
          this.inputRef.el.value = value.toDate().toLocaleDateString() + " 00:00:00";
        }
      }

      this.date=value.toDate();
      this.onDateChange();

    },

    onDateChange({ eventDate, useStatic } = {}) {
      console.log('codehere123');
      const { value } = this.inputRef.el;
      console.log('code crossed');
      let parsedDate = value && eventDate ? momentToLuxon(eventDate).setLocale(this.getOptions().locale): null;
      if (!parsedDate) {
          const options = this.getOptions(useStatic);
          parsedDate = this.parseValue(value, options)[0];
      }
      this.state.warning = parsedDate && parsedDate > DateTime.local();
      // Always update input.
      // if the date is invalid, it will reset to default (= given) date.
      // if the input is a computed date (+5d for instance), it will put the correct date.
      this.updateInput();
      if (parsedDate !== null && !areDateEquals(this.date, parsedDate)) {
          this.props.onDateTimeChanged(parsedDate);
      }
      try{
        this.inputRefBS.el.value=(ad2bs(moment(formatDateTime(parsedDate))));
      }
      catch{}
  },

  onInputClick() {
    if (!this.datePickerShown) {
        this.updateInput({ useStatic: true });
    }
    this.bootstrapDateTimePicker("toggle");
      try{
        this.inputRefBS.el.value=(ad2bs(moment(formatDateTime(this.date))));
      }
      catch{}
    
    // this.inputRefBS.el.value = ad2bs(moment(formatDateTime(this.date)));

},
  /**
     * Updates the input element with the current formatted date value.
     * @param {Object} [params={}]
     * @param {boolean} [params.useStatic]
     */
  updateInput({ useStatic } = {}) {
    const [formattedDate] = this.formatValue(this.date, this.getOptions(useStatic));
    if (formattedDate !== null) {
        this.inputRef.el.value = formattedDate;
        this.props.onUpdateInput(formattedDate);
    }
},

switch_calendar(){
  if (this.rootRefBS.el.style['display']=="none"){
    this.rootRefBS.el.style['display']="block";
    this.rootRefAD.el.style['display']="none";
  }
  else{
    this.rootRefBS.el.style['display']="none";
    this.rootRefAD.el.style['display']="block";
  }
}

  });

  patch(DateTimeField.prototype, "prototype patch", {
    get formattedValue() {     
      return formatDateTime(this.props.value) + " " + "("+ad2bs(moment(formatDateTime(this.props.value)))+")"
  }
  });

  patch(DateField.prototype, "prototype patch", {
    get formattedValue() {
      return this.isDateTime
          ? formatDateTime(this.props.value, { format: localization.dateFormat }) + " " + "("+ad2bs(moment(formatDateTime(this.props.value)))+")"
          : formatDate(this.props.value) + " " + "("+ad2bs(moment(formatDateTime(this.props.value)))+")";
  }
  });