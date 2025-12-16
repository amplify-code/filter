// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent ? $.ascent : {};
var FilterBar = {
  _init: function _init() {
    var self = this;
    this.widget = this;

    // Watch for change events within the element:
    $(this.element).on('change', function (e) {
      // if the element is marked filter ignore, don't trigger an update
      if ($(e.target).data('filter-ignore') == 1 || $(e.target).hasClass('filter-ignore')) {
        console.log('skipping filter update - element is marked filter-ignore', e.target);
        return;
      }

      // if the element is within a filter-ignore element (i.e. come form of compound element),
      // also don't trigger the update
      if ($(e.target).parents('[data-filter-ignore=1], .filter-ignore').length > 0) {
        console.log('skipping filter update - parent is marked filter-ignore');
        return;
      }
      self.sendUpdate();

      // alert('filter change detected');  
    });

    // send initial event to trigger display load
    // * ?disabled as the display now renders the first page on load *
    // self.sendUpdate();

    this.element.addClass("initialised");
  },
  // trigger an event which causes the display to load data
  sendUpdate: function sendUpdate() {
    $(this.element).trigger('filters-updated');
  }
};
$.widget('ascent.filterbar', FilterBar);
$.extend($.ascent.FilterBar, {});

// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent ? $.ascent : {};
var FilterDataTable = {
  _init: function _init() {
    var self = this;
    this.widget = this;

    // send initial event to trigger display load
    // * ?disabled as the display now renders the first page on load *
    // self.sendUpdate();

    // handle clicks on filter / sort elements:
    $(this.element).on('click', '.filter-panel', function (e) {
      e.stopPropagation();
    });
    $(this.element).on('click', 'thead .filter-toggle', function (e) {
      e.preventDefault();
      // open the panel
      $(this).parents('.filter').find('.filter-panel').slideDown(100, function () {
        panel = this;

        // handle close on click outside
        $('body').on('click', function (e) {
          $(panel).slideUp(100);
          $('body').unbind('click');
        });
      });
    });

    // click the update button in the panel
    $(this.element).on('click', 'thead .btn-filter-update', function (e) {
      self.sendUpdate();
      e.stopPropagation();
      e.preventDefault();
    });
    $(this.element).on('click', '.filter-clear', function (e) {
      e.preventDefault();
      $(this).parents('.filter-panel').find('input').each(function (idx) {
        if ($(this).attr('type') == 'checkbox' || $(this).attr('type') == 'radio') {
          $(this).prop('checked', false);
        } else {
          $(this).val('');
        }
      });
      self.sendUpdate();
    });
    $(this.element).on('click', 'thead .sort-link', function (e) {
      // set the hidden field to the new sort direction and fire a change event
      var th = $(this).parents("th");
      var slug = th.data('column');
      var sortfield = $(th).find('input#sort-' + slug);
      var sort = $(sortfield).val();

      // remove ALL sorters... otherwise a previous column will take precedence
      $(self.element).find('input.sort-dir').val('');

      // Apply this sort
      switch (sort) {
        case 'asc':
          sort = 'desc';
          break;
        case 'desc':
          sort = '';
          break;
        case '':
          sort = 'asc';
          break;
      }
      $(sortfield).val(sort); //trigger('change');
      self.sendUpdate();
      e.preventDefault();
    });
    $(this.element).on('click', 'thead .copy-link', function (e) {
      var th = $(this).parents("th");
      var slug = th.data('column');
      $(self.element).trigger('request-copydata', [slug, e]);
      return false;
    });
    this.element.addClass("initialised");
  },
  // trigger an event which causes the display to load data
  sendUpdate: function sendUpdate() {
    // send the event
    $(this.element).trigger('filters-updated');

    // refresh UI (set classes based on filter and sorter values)
    this.refreshUI();
  },
  refreshUI: function refreshUI() {
    // check all sorters and apply the right classes:
    $(this.element).find('A.sort-link').removeClass('sort-link-asc').removeClass('sort-link-desc').each(function (idx) {
      var sort = $(this).find('input.sort-dir').val();
      if (sort != '') {
        $(this).addClass('sort-link-' + sort);
      }
    });

    // check all filters:
    // TODO: test with checkboxes / radiobuttons / multiple text etc
    $(this.element).find('.filter-toggle').removeClass('filter-active');
    $('.filter').each(function (idx) {
      if ($(this).find('input').filter(function () {
        if ($(this).attr('type') == 'text') {
          return $(this).val() != '';
        } else {
          return $(this).is(":checked"); //== 'checked';
        }
      }).length > 0) {
        $(this).find('.filter-toggle').addClass('filter-active');
      }
    });

    // close all panels
    $('.filter-panel').slideUp(100);
    $('body').unbind('click');
  }
};
$.widget('ascent.filterdatatable', FilterDataTable);
$.extend($.ascent.FilterDataTable, {});

// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent ? $.ascent : {};
var FilterDisplay = {
  filterData: null,
  queryString: null,
  _init: function _init() {
    var self = this;
    this.widget = this;
    this.element.addClass("initialised");

    // hmm - it would appear that this widget is now redundant. 
    // All the code has been moved to the FilterView.
  }
};

$.widget('ascent.filterdisplay', FilterDisplay);
$.extend($.ascent.FilterDisplay, {});

// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent ? $.ascent : {};
var FilterTags = {
  _init: function _init() {
    var self = this;
    this.widget = this;

    // $(this.element).find('.filter-source').autocomplete({
    //     source: $(this.element).data('filter-source'),
    //     select: function(event, ui) {
    //         console.log(event, ui);
    //         console.log($(this).val());
    //         $(this).val('');
    //         let tag = $('<div class="badge badge-primary mt-1 filter-tag" style="font-size: 0.9rem"><span class="filter-tag-text">' + ui.item.label + '</span><input type="hidden" name="' + $(self.element).data('filter-name') + '[]" value="' + ui.item.id + '"/><a href="#" class="remove-item bi-x-circle-fill pl-1" style="color: inherit"></a></div>');
    //         $(this).parents('.filter-tags').find('.filter-tags-display').append(tag);
    //         tag.trigger('change');
    //         self.refreshUI();
    //         return false;
    //     }
    // });

    $(this.element).on('focus', '.filter-source', function () {
      $(this).autocomplete({
        source: $(self.element).data('filter-source'),
        select: function select(event, ui) {
          console.log(event, ui);
          console.log($(this).val());
          $(this).val('');
          var tag = $('<div class="badge badge-primary mt-1 filter-tag" style="font-size: 0.9rem"><span class="filter-tag-text">' + ui.item.label + '</span><input type="hidden" name="' + $(self.element).data('filter-name') + '[]" value="' + ui.item.id + '"/><a href="#" class="remove-item bi-x-circle-fill pl-1" style="color: inherit"></a></div>');
          $(this).parents('.filter-tags').find('.filter-tags-display').append(tag);
          tag.trigger('change');
          // self.refreshUI();
          return false;
        }
      });
    });
    $(this.element).on('blur', '.filter-source', function () {
      $(this).autocomplete('destroy');
    });
    $(this.element).on('click', '.remove-item', function () {
      var parent = $(this).parents('.filter-tags-display');
      $(this).parents('.badge').remove();
      $(parent).trigger('change');
      // self.refreshUI();
      return false;
    });

    // this.refreshUI();

    this.element.addClass("initialised");
  },
  /* updates the UI, showing toggle switch and placeholder text as needed */
  /* See the comments in the CSS - this can be removed once FF supports :has() */
  refreshUI: function refreshUI() {
    // if two or more values show toggleswitch:
    if ($(this.element).find('.badge').length >= 2) {
      $(this.element).find('.toggle-switch').show();
      $(this.element).removeClass('show-placeholder');
    } else {
      $(this.element).find('.toggle-switch').hide();
      $(this.element).addClass('show-placeholder');
    }
  }
};
$.widget('ascent.filtertags', FilterTags);
$.extend($.ascent.FilterTags, {});

//         
//     });
// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent ? $.ascent : {};
var FilterView = {
  initialState: null,
  qsTargets: '.filter-view, .filter-qs-include',
  baseUri: '',
  forceUri: false,
  _init: function _init() {
    var self = this;
    this.widget = this;
    var forceUri = $(this.element).data('force-uri');
    if (forceUri != undefined) {
      if (forceUri) {
        this.forceUri = true;
      }
    } else {
      // alert('undef');
    }

    // filter options have been changed
    // - should reload first page
    $(this.element).on('filters-updated', function (e) {
      self.loadPage(e);
    });

    // hijack pagination links:
    $(this.element).on('click', '.filter-paginator .page-link', function (e) {
      // alert('page link');
      var page = $(e.currentTarget).data('target-page');

      //set the hidden page number field so the target variable is set in the 
      // ajax request
      $(self.element).find('.filter-paginator INPUT.page').val(page);
      self.loadPage(e);
      return false;
    });
    $(this.element).on('click', '.filter-item.load-in-place, .filter-item.retain-filters', function (e) {
      e.preventDefault();
      var url2 = $(this).find('a').attr('href');
      window.location = url2 + window.location.search;
      return;
      // alert('load item');
      $(self.element).addClass('filter-updating');
      var url = $(this).find('a').attr('href');
      // console.log(this);

      $.ajax({
        url: url,
        type: 'post',
        headers: {
          'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
      }).done(function (data) {
        $('.filter-page, .filter-paginator, .filter-counter').html('');
        $('.filter-itemcontent').html(data);
        history.pushState([], 'title', url + window.location.search);
        // self.storeState();
      }).then(function () {
        $(self.element).removeClass('filter-updating');
      });
    });

    // user requested a copy operation (on a DataTable)
    $(this.element).on('request-copydata', function (e, slug, triggerEvent) {
      self.copyData(slug, triggerEvent);
    });

    // user requested an data export:
    $(this.element).on('click', '.filter-export', function () {
      self.exportData();
    });
    $(this.element).on('click', '.filter-copy-data', function (e) {
      self.copyData('', e);
      return false;
    });

    // Work out the base path for all the ajax operations
    // let pathary = $(this.element).attr('action').split('/');
    // let pop = pathary.pop(); 
    // this.baseUri = (pathary.join('/'));
    this.baseUri = $(this.element).attr('action');

    // this.initialState = this.collectState();
    // this.storeState();
    // capture the initial state:
    // history.replaceState(this.collectState(), '', window.location);
    $(document).statemanager('pushState', window.location, true);

    // flag as initialised.
    this.element.addClass("initialised");
  },
  // Handles an Ajax call to load a page of results and related UI updates
  loadPage: function loadPage(e) {
    var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    // calculate the query string based on the current field selection
    // let qs = '?' + $(this.element).find("INPUT, SELECT").not('[name=_token]').serialize();

    // ability to add extra elements to the qs
    // - default is to find ALL .filter-views on the page:
    // - plus anything classed as '.filter-qs-include'
    var qs = '?' + $(this.qsTargets).find("INPUT, SELECT").not('[name=_token]').serialize();
    if (this.forceUri && window.location.pathname != this.baseUri) {
      // if we're not viewing the main URL (such as an item show view), just load the URL
      // (would be nicer to manipulate the the DOM, but that comes with a world of problems for now)
      // alert('here');
      window.location = this.baseUri + qs;
      return;
    }

    // If we're already on the right page, do this bit via ajax
    var self = this;
    $(self.element).addClass('filter-updating');
    var filterData = new FormData($(this.element)[0]);
    filterData.append('config', $(this.element).data('filtersetup'));

    // we need to detect all the filter UIs 
    // and get their config information (itemBlade for example). The Ajax call will render each view into the JSON reply

    var pages = {};
    $(this.element).find('.filter-page').each(function (idx) {
      console.log('page config:', $(this).data('config'));
      pages[$(this).attr('id')] = $(this).data('config');
    });
    filterData.append('pages', JSON.stringify(pages));
    var counters = {};
    $(this.element).find('.filter-counter').each(function (idx) {
      counters[$(this).attr('id')] = $(this).data('config');
    });
    filterData.append('counters', JSON.stringify(counters));
    var paginators = {};
    $(this.element).find('.filter-paginator').each(function (idx) {
      paginators[$(this).attr('id')] = $(this).data('config');
    });
    filterData.append('paginators', JSON.stringify(paginators));
    var filterfields = {};
    $(this.element).find('.filter-field').each(function (idx) {
      console.log(idx);
      filterfields[$(this).attr('id')] = $(this).data('config');
    });
    filterData.append('fields', JSON.stringify(filterfields));

    // perform the lookup            
    $.ajax({
      url: this.baseUri,
      //+ "/loadpage",
      type: 'post',
      data: filterData,
      contentType: false,
      processData: false,
      headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
      }
    }).done(function (data) {
      $('.filter-itemcontent').html('');
      self.setState(data);

      // pushState:
      // call the History API to update the URL in the browser:
      // or, maybe this should be done by the display when the first page is loaded, so the results can be stored?
      // let href = window.location.pathname;
      var uri = window.location.pathname;
      if (this.forceUri) {
        var _uri = self.baseUri;
      }
      $(document).statemanager('pushState', uri + qs);
      // history.pushState(self.collectState(), 'title', uri + qs);

      // self.storeState();

      $(document).trigger('filter-page-loaded');
    }).fail(function (data) {
      alert('fail');
    }).then(function () {
      $(self.element).removeClass('filter-updating');
      // $(self.element).css('opacity', 1);
    });
  },

  // loadState: function() {
  //     // not needed.
  //     return JSON.parse(localStorage.getItem('state-' + window.location));
  // },

  // storeState: function() {
  //     // not needed.
  //     // let state = this.collectState();
  //     // localStorage.setItem('state-' + window.location, JSON.stringify(state));

  // },

  // Grabs the HTML content of the various filter elements.
  // Slightly more flexible than just storing incoming data as it allows any event to
  // to trigger a save of all elements.
  // just need to use a decent format:
  collectState: function collectState() {
    var data = {};
    var pages = {};
    $(this.element).find('.filter-page').each(function (idx) {
      var id = $(this).attr('id');
      pages[id] = $(this).html();
    });
    data.pages = pages;
    var paginators = {};
    $(this.element).find('.filter-paginator').each(function (idx) {
      var id = $(this).attr('id');
      paginators[id] = $(this).html();
    });
    data.paginators = paginators;
    var counters = {};
    $(this.element).find('.filter-counter').each(function (idx) {
      var id = $(this).attr('id');
      counters[id] = $(this).html();
    });
    data.counters = counters;
    var fields = {};
    $(this.element).find('.filter-field').each(function (idx) {
      var id = $(this).attr('id');
      fields[id] = $(this).html();
    });
    data.fields = fields;
    var itemcontent = {};
    $(this.element).find('.filter-itemcontent').each(function (idx) {
      var id = $(this).attr('id');
      itemcontent[id] = $(this).html();
    });
    data.itemcontent = itemcontent;
    console.log(data);
    return data;
  },
  // Updates the UI after a page load operation (or a popstate change)
  setState: function setState(data) {
    console.log('setting ui state');

    // let elms = $(this.element).find('.filter-page');
    // console.log(data.pages.length);
    // for(let iPage = 0; iPage < data.pages.length; iPage++) {
    //     console.log('iPage: ' + iPage);
    //     $(elms[iPage]).html(data.pages[iPage]);
    // }

    for (var id in data.pages) {
      console.log(id);
      $(this.element).find('.filter-page#' + id).html(data.pages[id]);
    }
    ;
    for (var _id in data.paginators) {
      $(this.element).find('.filter-paginator#' + _id).html(data.paginators[_id]);
    }
    for (var _id2 in data.counters) {
      console.log(_id2);
      console.log(data.counters[_id2]);
      $(this.element).find('.filter-counter#' + _id2).html(data.counters[_id2]);
    }
    for (var _id3 in data.fields) {
      $(this.element).find('.filter-field#' + _id3).html(data.fields[_id3]);
    }
    for (var _id4 in data.itemcontent) {
      $(this.element).find('.filter-itemcontent#' + _id4).html(data.itemcontent[_id4]);
    }
  },
  // Handle an ajax call to fetch data and copy to the clipboard on success
  // Also display a 'copied' toast.
  copyData: function copyData(col, triggerEvent) {
    var self = this;

    // $(this.element).css('opacity', 0.2);
    $(this.element).addClass('filter-updating');
    var filterData = new FormData($(this.element)[0]);
    filterData.append('config', $(this.element).data('filtersetup'));

    // console.log(filterData);
    // console.log($(this.element).serialize());

    // does an AJAX request to get ALL pages of data, not just current.
    $.ajax({
      url: this.baseUri + '/copy/' + col,
      // url: this.baseUri + '/copy',
      type: 'post',
      data: filterData,
      contentType: false,
      processData: false,
      headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
      }
    }).done(function (data) {
      // write the data to the clipboard
      // NB :: HTTPS required for this to work,

      console.log(data);
      var obj = {};
      for (format in data.data) {
        obj[format] = new Blob([data.data[format]], {
          type: format
        });
      }
      if (navigator.clipboard) {
        navigator.clipboard.write([new ClipboardItem(obj)]).then(function (value) {
          // console.log(value);
        });
      }
      var toast = $(data.toast);
      if (toast) {
        $('body').append(toast);

        // Get positioning Rects
        var causer = triggerEvent.target;
        var rect = causer.getBoundingClientRect();
        var tRect = toast[0].getBoundingClientRect();

        // delete from the DOM once faded out
        $(toast).on('hidden.bs.toast', function () {
          $(toast).remove();
        });

        // Position the toast near the calling button. 
        $(toast).css('top', rect.bottom + window.scrollY + 5 + 'px').css('left', rect.right - tRect.width - 5 + 'px').toast('show');
      }
      var modal = $(data.modal);
      if (modal) {
        $('body').append(modal);
        $(modal).on('hidden.bs.modal', function () {
          $(modal).remove();
        });
        $(modal).modal('show');
      }

      // $(self.element).css('opacity', 1);
      $(self.element).removeClass('filter-updating');
    }).fail(function (data) {
      // need to be more helpful here...
      alert('Unable to copy data');
    });
  },
  // Perform a data export. Essentially just a get request with the current QueryString
  exportData: function exportData(e, col, triggerEvent) {
    window.location = this.baseUri + '/export' + window.location.search;
  }
};
$.widget('ascent.filterview', FilterView);
$.extend($.ascent.FilterView, {});

// Code (c) Kieran Metcalfe / Ascent Creative 2023

//  NOTE - order of widget init is important. Display must initialise before the bar so that the initial bar event will be caught

// init on document ready
$(document).ready(function () {
  // alert('init blockselect');

  $('.filter-view').not('.initialised').filterview();
  $('.filter-display').not('.initialised').filterdisplay();
  $('.filter-bar').not('.initialised').filterbar();
  $('.filter-tags').not('.initialised').filtertags();
  $('.filter-datatable').not('.initialised').filterdatatable();
});
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function (mutations, observer) {
  // fired when a mutation occurs
  // console.log(mutations, observer);
  // ...
  $('.filter-view').not('.initialised').filterview();
  $('.filter-display').not('.initialised').filterdisplay();
  $('.filter-bar').not('.initialised').filterbar();
  $('.filter-tags').not('.initialised').filtertags();
  $('.filter-datatable').not('.initialised').filterdatatable();
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true
  //...
});

var diffDOM = function (e) {
  "use strict";

  function t(e, n, o) {
    var s;
    return "#text" === e.nodeName ? s = o.document.createTextNode(e.data) : "#comment" === e.nodeName ? s = o.document.createComment(e.data) : (n ? s = o.document.createElementNS("http://www.w3.org/2000/svg", e.nodeName) : "svg" === e.nodeName.toLowerCase() ? (s = o.document.createElementNS("http://www.w3.org/2000/svg", "svg"), n = !0) : s = o.document.createElement(e.nodeName), e.attributes && Object.entries(e.attributes).forEach(function (e) {
      var t = e[0],
        n = e[1];
      return s.setAttribute(t, n);
    }), e.childNodes && e.childNodes.forEach(function (e) {
      return s.appendChild(t(e, n, o));
    }), o.valueDiffing && (e.value && (s.value = e.value), e.checked && (s.checked = e.checked), e.selected && (s.selected = e.selected))), s;
  }
  function n(e, t) {
    for (t = t.slice(); t.length > 0;) {
      if (!e.childNodes) return !1;
      var n = t.splice(0, 1)[0];
      e = e.childNodes[n];
    }
    return e;
  }
  function o(e, o, s) {
    var i,
      a,
      l,
      c,
      r = n(e, o[s._const.route]),
      u = {
        diff: o,
        node: r
      };
    if (s.preDiffApply(u)) return !0;
    switch (o[s._const.action]) {
      case s._const.addAttribute:
        if (!r || !r.setAttribute) return !1;
        r.setAttribute(o[s._const.name], o[s._const.value]);
        break;
      case s._const.modifyAttribute:
        if (!r || !r.setAttribute) return !1;
        r.setAttribute(o[s._const.name], o[s._const.newValue]), "INPUT" === r.nodeName && "value" === o[s._const.name] && (r.value = o[s._const.newValue]);
        break;
      case s._const.removeAttribute:
        if (!r || !r.removeAttribute) return !1;
        r.removeAttribute(o[s._const.name]);
        break;
      case s._const.modifyTextElement:
        if (!r || 3 !== r.nodeType) return !1;
        s.textDiff(r, r.data, o[s._const.oldValue], o[s._const.newValue]);
        break;
      case s._const.modifyValue:
        if (!r || void 0 === r.value) return !1;
        r.value = o[s._const.newValue];
        break;
      case s._const.modifyComment:
        if (!r || void 0 === r.data) return !1;
        s.textDiff(r, r.data, o[s._const.oldValue], o[s._const.newValue]);
        break;
      case s._const.modifyChecked:
        if (!r || void 0 === r.checked) return !1;
        r.checked = o[s._const.newValue];
        break;
      case s._const.modifySelected:
        if (!r || void 0 === r.selected) return !1;
        r.selected = o[s._const.newValue];
        break;
      case s._const.replaceElement:
        r.parentNode.replaceChild(t(o[s._const.newValue], "svg" === o[s._const.newValue].nodeName.toLowerCase(), s), r);
        break;
      case s._const.relocateGroup:
        Array.apply(void 0, new Array(o.groupLength)).map(function () {
          return r.removeChild(r.childNodes[o[s._const.from]]);
        }).forEach(function (e, t) {
          0 === t && (a = r.childNodes[o[s._const.to]]), r.insertBefore(e, a || null);
        });
        break;
      case s._const.removeElement:
        r.parentNode.removeChild(r);
        break;
      case s._const.addElement:
        c = (l = o[s._const.route].slice()).splice(l.length - 1, 1)[0], (r = n(e, l)).insertBefore(t(o[s._const.element], "http://www.w3.org/2000/svg" === r.namespaceURI, s), r.childNodes[c] || null);
        break;
      case s._const.removeTextElement:
        if (!r || 3 !== r.nodeType) return !1;
        r.parentNode.removeChild(r);
        break;
      case s._const.addTextElement:
        if (c = (l = o[s._const.route].slice()).splice(l.length - 1, 1)[0], i = s.document.createTextNode(o[s._const.value]), !(r = n(e, l)) || !r.childNodes) return !1;
        r.insertBefore(i, r.childNodes[c] || null);
        break;
      default:
        console.log("unknown action");
    }
    return u.newNode = i, s.postDiffApply(u), !0;
  }
  function s(e, t, n) {
    var o = e[t];
    e[t] = e[n], e[n] = o;
  }
  function i(e, t, n) {
    t.length || (t = [t]), (t = t.slice()).reverse(), t.forEach(function (t) {
      !function (e, t, n) {
        switch (t[n._const.action]) {
          case n._const.addAttribute:
            t[n._const.action] = n._const.removeAttribute, o(e, t, n);
            break;
          case n._const.modifyAttribute:
            s(t, n._const.oldValue, n._const.newValue), o(e, t, n);
            break;
          case n._const.removeAttribute:
            t[n._const.action] = n._const.addAttribute, o(e, t, n);
            break;
          case n._const.modifyTextElement:
          case n._const.modifyValue:
          case n._const.modifyComment:
          case n._const.modifyChecked:
          case n._const.modifySelected:
          case n._const.replaceElement:
            s(t, n._const.oldValue, n._const.newValue), o(e, t, n);
            break;
          case n._const.relocateGroup:
            s(t, n._const.from, n._const.to), o(e, t, n);
            break;
          case n._const.removeElement:
            t[n._const.action] = n._const.addElement, o(e, t, n);
            break;
          case n._const.addElement:
            t[n._const.action] = n._const.removeElement, o(e, t, n);
            break;
          case n._const.removeTextElement:
            t[n._const.action] = n._const.addTextElement, o(e, t, n);
            break;
          case n._const.addTextElement:
            t[n._const.action] = n._const.removeTextElement, o(e, t, n);
            break;
          default:
            console.log("unknown action");
        }
      }(e, t, n);
    });
  }
  var a = function a(e) {
    var t = this;
    void 0 === e && (e = {}), Object.entries(e).forEach(function (e) {
      var n = e[0],
        o = e[1];
      return t[n] = o;
    });
  };
  function l(e) {
    var t = [];
    return t.push(e.nodeName), "#text" !== e.nodeName && "#comment" !== e.nodeName && e.attributes && (e.attributes["class"] && t.push(e.nodeName + "." + e.attributes["class"].replace(/ /g, ".")), e.attributes.id && t.push(e.nodeName + "#" + e.attributes.id)), t;
  }
  function c(e) {
    var t = {},
      n = {};
    return e.forEach(function (e) {
      l(e).forEach(function (e) {
        var o = (e in t);
        o || e in n ? o && (delete t[e], n[e] = !0) : t[e] = !0;
      });
    }), t;
  }
  function r(e, t) {
    var n = c(e),
      o = c(t),
      s = {};
    return Object.keys(n).forEach(function (e) {
      o[e] && (s[e] = !0);
    }), s;
  }
  function u(e) {
    return delete e.outerDone, delete e.innerDone, delete e.valueDone, !e.childNodes || e.childNodes.every(u);
  }
  function d(e, t) {
    if (!["nodeName", "value", "checked", "selected", "data"].every(function (n) {
      return e[n] === t[n];
    })) return !1;
    if (Boolean(e.attributes) !== Boolean(t.attributes)) return !1;
    if (Boolean(e.childNodes) !== Boolean(t.childNodes)) return !1;
    if (e.attributes) {
      var n = Object.keys(e.attributes),
        o = Object.keys(t.attributes);
      if (n.length !== o.length) return !1;
      if (!n.every(function (n) {
        return e.attributes[n] === t.attributes[n];
      })) return !1;
    }
    if (e.childNodes) {
      if (e.childNodes.length !== t.childNodes.length) return !1;
      if (!e.childNodes.every(function (e, n) {
        return d(e, t.childNodes[n]);
      })) return !1;
    }
    return !0;
  }
  function h(e, t, n, o, s) {
    if (!e || !t) return !1;
    if (e.nodeName !== t.nodeName) return !1;
    if ("#text" === e.nodeName) return !!s || e.data === t.data;
    if (e.nodeName in n) return !0;
    if (e.attributes && t.attributes) {
      if (e.attributes.id) {
        if (e.attributes.id !== t.attributes.id) return !1;
        if (e.nodeName + "#" + e.attributes.id in n) return !0;
      }
      if (e.attributes["class"] && e.attributes["class"] === t.attributes["class"]) if (e.nodeName + "." + e.attributes["class"].replace(/ /g, ".") in n) return !0;
    }
    if (o) return !0;
    var i = e.childNodes ? e.childNodes.slice().reverse() : [],
      a = t.childNodes ? t.childNodes.slice().reverse() : [];
    if (i.length !== a.length) return !1;
    if (s) return i.every(function (e, t) {
      return e.nodeName === a[t].nodeName;
    });
    var l = r(i, a);
    return i.every(function (e, t) {
      return h(e, a[t], l, !0, !0);
    });
  }
  function f(e) {
    return JSON.parse(JSON.stringify(e));
  }
  function p(e, t, n, o) {
    var s = 0,
      i = [],
      a = e.length,
      c = t.length,
      u = Array.apply(void 0, new Array(a + 1)).map(function () {
        return [];
      }),
      d = r(e, t),
      f = a === c;
    f && e.some(function (e, n) {
      var o = l(e),
        s = l(t[n]);
      return o.length !== s.length ? (f = !1, !0) : (o.some(function (e, t) {
        if (e !== s[t]) return f = !1, !0;
      }), !f || void 0);
    });
    for (var p = 0; p < a; p++) {
      for (var m = e[p], _ = 0; _ < c; _++) {
        var V = t[_];
        n[p] || o[_] || !h(m, V, d, f) ? u[p + 1][_ + 1] = 0 : (u[p + 1][_ + 1] = u[p][_] ? u[p][_] + 1 : 1, u[p + 1][_ + 1] >= s && (s = u[p + 1][_ + 1], i = [p + 1, _ + 1]));
      }
    }
    return 0 !== s && {
      oldValue: i[0] - s,
      newValue: i[1] - s,
      length: s
    };
  }
  function m(e, t) {
    return Array.apply(void 0, new Array(e)).map(function () {
      return t;
    });
  }
  a.prototype.toString = function () {
    return JSON.stringify(this);
  }, a.prototype.setValue = function (e, t) {
    return this[e] = t, this;
  };
  var _ = function _() {
    this.list = [];
  };
  function V(e, t) {
    var n,
      o,
      s = e;
    for (t = t.slice(); t.length > 0;) {
      if (!s.childNodes) return !1;
      o = t.splice(0, 1)[0], n = s, s = s.childNodes[o];
    }
    return {
      node: s,
      parentNode: n,
      nodeIndex: o
    };
  }
  function g(e, t, n) {
    return t.forEach(function (t) {
      !function (e, t, n) {
        var o,
          s,
          i,
          a = V(e, t[n._const.route]),
          l = a.node,
          c = a.parentNode,
          r = a.nodeIndex,
          u = [],
          d = {
            diff: t,
            node: l
          };
        if (n.preVirtualDiffApply(d)) return !0;
        switch (t[n._const.action]) {
          case n._const.addAttribute:
            l.attributes || (l.attributes = {}), l.attributes[t[n._const.name]] = t[n._const.value], "checked" === t[n._const.name] ? l.checked = !0 : "selected" === t[n._const.name] ? l.selected = !0 : "INPUT" === l.nodeName && "value" === t[n._const.name] && (l.value = t[n._const.value]);
            break;
          case n._const.modifyAttribute:
            l.attributes[t[n._const.name]] = t[n._const.newValue];
            break;
          case n._const.removeAttribute:
            delete l.attributes[t[n._const.name]], 0 === Object.keys(l.attributes).length && delete l.attributes, "checked" === t[n._const.name] ? l.checked = !1 : "selected" === t[n._const.name] ? delete l.selected : "INPUT" === l.nodeName && "value" === t[n._const.name] && delete l.value;
            break;
          case n._const.modifyTextElement:
            l.data = t[n._const.newValue];
            break;
          case n._const.modifyValue:
            l.value = t[n._const.newValue];
            break;
          case n._const.modifyComment:
            l.data = t[n._const.newValue];
            break;
          case n._const.modifyChecked:
            l.checked = t[n._const.newValue];
            break;
          case n._const.modifySelected:
            l.selected = t[n._const.newValue];
            break;
          case n._const.replaceElement:
            (o = f(t[n._const.newValue])).outerDone = !0, o.innerDone = !0, o.valueDone = !0, c.childNodes[r] = o;
            break;
          case n._const.relocateGroup:
            l.childNodes.splice(t[n._const.from], t.groupLength).reverse().forEach(function (e) {
              return l.childNodes.splice(t[n._const.to], 0, e);
            }), l.subsets && l.subsets.forEach(function (e) {
              if (t[n._const.from] < t[n._const.to] && e.oldValue <= t[n._const.to] && e.oldValue > t[n._const.from]) {
                e.oldValue -= t.groupLength;
                var o = e.oldValue + e.length - t[n._const.to];
                o > 0 && (u.push({
                  oldValue: t[n._const.to] + t.groupLength,
                  newValue: e.newValue + e.length - o,
                  length: o
                }), e.length -= o);
              } else if (t[n._const.from] > t[n._const.to] && e.oldValue > t[n._const.to] && e.oldValue < t[n._const.from]) {
                e.oldValue += t.groupLength;
                var s = e.oldValue + e.length - t[n._const.to];
                s > 0 && (u.push({
                  oldValue: t[n._const.to] + t.groupLength,
                  newValue: e.newValue + e.length - s,
                  length: s
                }), e.length -= s);
              } else e.oldValue === t[n._const.from] && (e.oldValue = t[n._const.to]);
            });
            break;
          case n._const.removeElement:
            c.childNodes.splice(r, 1), c.subsets && c.subsets.forEach(function (e) {
              e.oldValue > r ? e.oldValue -= 1 : e.oldValue === r ? e["delete"] = !0 : e.oldValue < r && e.oldValue + e.length > r && (e.oldValue + e.length - 1 === r ? e.length-- : (u.push({
                newValue: e.newValue + r - e.oldValue,
                oldValue: r,
                length: e.length - r + e.oldValue - 1
              }), e.length = r - e.oldValue));
            }), l = c;
            break;
          case n._const.addElement:
            s = t[n._const.route].slice(), i = s.splice(s.length - 1, 1)[0], l = V(e, s).node, (o = f(t[n._const.element])).outerDone = !0, o.innerDone = !0, o.valueDone = !0, l.childNodes || (l.childNodes = []), i >= l.childNodes.length ? l.childNodes.push(o) : l.childNodes.splice(i, 0, o), l.subsets && l.subsets.forEach(function (e) {
              if (e.oldValue >= i) e.oldValue += 1;else if (e.oldValue < i && e.oldValue + e.length > i) {
                var t = e.oldValue + e.length - i;
                u.push({
                  newValue: e.newValue + e.length - t,
                  oldValue: i + 1,
                  length: t
                }), e.length -= t;
              }
            });
            break;
          case n._const.removeTextElement:
            c.childNodes.splice(r, 1), "TEXTAREA" === c.nodeName && delete c.value, c.subsets && c.subsets.forEach(function (e) {
              e.oldValue > r ? e.oldValue -= 1 : e.oldValue === r ? e["delete"] = !0 : e.oldValue < r && e.oldValue + e.length > r && (e.oldValue + e.length - 1 === r ? e.length-- : (u.push({
                newValue: e.newValue + r - e.oldValue,
                oldValue: r,
                length: e.length - r + e.oldValue - 1
              }), e.length = r - e.oldValue));
            }), l = c;
            break;
          case n._const.addTextElement:
            s = t[n._const.route].slice(), i = s.splice(s.length - 1, 1)[0], (o = {}).nodeName = "#text", o.data = t[n._const.value], (l = V(e, s).node).childNodes || (l.childNodes = []), i >= l.childNodes.length ? l.childNodes.push(o) : l.childNodes.splice(i, 0, o), "TEXTAREA" === l.nodeName && (l.value = t[n._const.newValue]), l.subsets && l.subsets.forEach(function (e) {
              if (e.oldValue >= i && (e.oldValue += 1), e.oldValue < i && e.oldValue + e.length > i) {
                var t = e.oldValue + e.length - i;
                u.push({
                  newValue: e.newValue + e.length - t,
                  oldValue: i + 1,
                  length: t
                }), e.length -= t;
              }
            });
            break;
          default:
            console.log("unknown action");
        }
        l.subsets && (l.subsets = l.subsets.filter(function (e) {
          return !e["delete"] && e.oldValue !== e.newValue;
        }), u.length && (l.subsets = l.subsets.concat(u))), d.newNode = o, n.postVirtualDiffApply(d);
      }(e, t, n);
    }), !0;
  }
  function v(e, t) {
    void 0 === t && (t = {});
    var n = {};
    if (n.nodeName = e.nodeName, "#text" === n.nodeName || "#comment" === n.nodeName) n.data = e.data;else {
      if (e.attributes && e.attributes.length > 0) n.attributes = {}, Array.prototype.slice.call(e.attributes).forEach(function (e) {
        return n.attributes[e.name] = e.value;
      });
      if ("TEXTAREA" === n.nodeName) n.value = e.value;else if (e.childNodes && e.childNodes.length > 0) {
        n.childNodes = [], Array.prototype.slice.call(e.childNodes).forEach(function (e) {
          return n.childNodes.push(v(e, t));
        });
      }
      t.valueDiffing && (void 0 !== e.checked && e.type && ["radio", "checkbox"].includes(e.type.toLowerCase()) ? n.checked = e.checked : void 0 !== e.value && (n.value = e.value), void 0 !== e.selected && (n.selected = e.selected));
    }
    return n;
  }
  _.prototype.add = function (e) {
    var t;
    (t = this.list).push.apply(t, e);
  }, _.prototype.forEach = function (e) {
    this.list.forEach(function (t) {
      return e(t);
    });
  };
  var N = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,
    b = Object.create ? Object.create(null) : {},
    y = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
  function w(e) {
    return e.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  var E = {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    menuItem: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0
  };
  function k(e) {
    var t = {
        nodeName: "",
        attributes: {}
      },
      n = e.match(/<\/?([^\s]+?)[/\s>]/);
    if (n && (t.nodeName = n[1].toUpperCase(), (E[n[1]] || "/" === e.charAt(e.length - 2)) && (t.voidElement = !0), t.nodeName.startsWith("!--"))) {
      var o = e.indexOf("--\x3e");
      return {
        type: "comment",
        data: -1 !== o ? e.slice(4, o) : ""
      };
    }
    for (var s = new RegExp(y), i = null, a = !1; !a;) {
      if (null === (i = s.exec(e))) a = !0;else if (i[0].trim()) if (i[1]) {
        var l = i[1].trim(),
          c = [l, ""];
        l.indexOf("=") > -1 && (c = l.split("=")), t.attributes[c[0]] = c[1], s.lastIndex--;
      } else i[2] && (t.attributes[i[2]] = i[3].trim().substring(1, i[3].length - 1));
    }
    return t;
  }
  function x(e) {
    return delete e.voidElement, e.childNodes && e.childNodes.forEach(function (e) {
      return x(e);
    }), e;
  }
  function A(e) {
    return x(function (e, t) {
      void 0 === t && (t = {
        components: b
      });
      var n,
        o = [],
        s = -1,
        i = [],
        a = !1;
      if (0 !== e.indexOf("<")) {
        var l = e.indexOf("<");
        o.push({
          nodeName: "#text",
          data: -1 === l ? e : e.substring(0, l)
        });
      }
      return e.replace(N, function (l, c) {
        if (a) {
          if (l !== "</" + n.nodeName + ">") return;
          a = !1;
        }
        var r,
          u = "/" !== l.charAt(1),
          d = l.startsWith("\x3c!--"),
          h = c + l.length,
          f = e.charAt(h);
        if (d) {
          var p = k(l);
          return s < 0 ? (o.push(p), o) : ((r = i[s]) && (r.childNodes || (r.childNodes = []), r.childNodes.push(p)), o);
        }
        if (u && (n = k(l), s++, "tag" === n.type && t.components[n.nodeName] && (n.type = "component", a = !0), n.voidElement || a || !f || "<" === f || (n.childNodes || (n.childNodes = []), n.childNodes.push({
          nodeName: "#text",
          data: w(e.slice(h, e.indexOf("<", h)))
        })), 0 === s && o.push(n), (r = i[s - 1]) && (r.childNodes || (r.childNodes = []), r.childNodes.push(n)), i[s] = n), (!u || n.voidElement) && (s > -1 && (n.voidElement || n.nodeName === l.slice(2, -1).toUpperCase()) && (s--, n = -1 === s ? o : i[s]), !a && "<" !== f && f)) {
          r = -1 === s ? o : i[s].childNodes || [];
          var m = e.indexOf("<", h),
            _ = w(e.slice(h, -1 === m ? void 0 : m));
          r.push({
            nodeName: "#text",
            data: _
          });
        }
      }), o[0];
    }(e));
  }
  var D = function D(e, t, n) {
    this.options = n, this.t1 = "undefined" != typeof HTMLElement && e instanceof HTMLElement ? v(e, this.options) : "string" == typeof e ? A(e, this.options) : JSON.parse(JSON.stringify(e)), this.t2 = "undefined" != typeof HTMLElement && t instanceof HTMLElement ? v(t, this.options) : "string" == typeof t ? A(t, this.options) : JSON.parse(JSON.stringify(t)), this.diffcount = 0, this.foundAll = !1, this.debug && (this.t1Orig = v(e, this.options), this.t2Orig = v(t, this.options)), this.tracker = new _();
  };
  D.prototype.init = function () {
    return this.findDiffs(this.t1, this.t2);
  }, D.prototype.findDiffs = function (e, t) {
    var n;
    do {
      if (this.options.debug && (this.diffcount += 1, this.diffcount > this.options.diffcap)) throw new Error("surpassed diffcap:" + JSON.stringify(this.t1Orig) + " -> " + JSON.stringify(this.t2Orig));
      0 === (n = this.findNextDiff(e, t, [])).length && (d(e, t) || (this.foundAll ? console.error("Could not find remaining diffs!") : (this.foundAll = !0, u(e), n = this.findNextDiff(e, t, [])))), n.length > 0 && (this.foundAll = !1, this.tracker.add(n), g(e, n, this.options));
    } while (n.length > 0);
    return this.tracker.list;
  }, D.prototype.findNextDiff = function (e, t, n) {
    var o, s;
    if (this.options.maxDepth && n.length > this.options.maxDepth) return [];
    if (!e.outerDone) {
      if (o = this.findOuterDiff(e, t, n), this.options.filterOuterDiff && (s = this.options.filterOuterDiff(e, t, o)) && (o = s), o.length > 0) return e.outerDone = !0, o;
      e.outerDone = !0;
    }
    if (!e.innerDone) {
      if ((o = this.findInnerDiff(e, t, n)).length > 0) return o;
      e.innerDone = !0;
    }
    if (this.options.valueDiffing && !e.valueDone) {
      if ((o = this.findValueDiff(e, t, n)).length > 0) return e.valueDone = !0, o;
      e.valueDone = !0;
    }
    return [];
  }, D.prototype.findOuterDiff = function (e, t, n) {
    var o,
      s,
      i,
      l,
      c,
      r,
      u = [];
    if (e.nodeName !== t.nodeName) {
      if (!n.length) throw new Error("Top level nodes have to be of the same kind.");
      return [new a().setValue(this.options._const.action, this.options._const.replaceElement).setValue(this.options._const.oldValue, f(e)).setValue(this.options._const.newValue, f(t)).setValue(this.options._const.route, n)];
    }
    if (n.length && this.options.maxNodeDiffCount < Math.abs((e.childNodes || []).length - (t.childNodes || []).length)) return [new a().setValue(this.options._const.action, this.options._const.replaceElement).setValue(this.options._const.oldValue, f(e)).setValue(this.options._const.newValue, f(t)).setValue(this.options._const.route, n)];
    if (e.data !== t.data) return "#text" === e.nodeName ? [new a().setValue(this.options._const.action, this.options._const.modifyTextElement).setValue(this.options._const.route, n).setValue(this.options._const.oldValue, e.data).setValue(this.options._const.newValue, t.data)] : [new a().setValue(this.options._const.action, this.options._const.modifyComment).setValue(this.options._const.route, n).setValue(this.options._const.oldValue, e.data).setValue(this.options._const.newValue, t.data)];
    for (s = e.attributes ? Object.keys(e.attributes).sort() : [], i = t.attributes ? Object.keys(t.attributes).sort() : [], l = s.length, r = 0; r < l; r++) {
      o = s[r], -1 === (c = i.indexOf(o)) ? u.push(new a().setValue(this.options._const.action, this.options._const.removeAttribute).setValue(this.options._const.route, n).setValue(this.options._const.name, o).setValue(this.options._const.value, e.attributes[o])) : (i.splice(c, 1), e.attributes[o] !== t.attributes[o] && u.push(new a().setValue(this.options._const.action, this.options._const.modifyAttribute).setValue(this.options._const.route, n).setValue(this.options._const.name, o).setValue(this.options._const.oldValue, e.attributes[o]).setValue(this.options._const.newValue, t.attributes[o])));
    }
    for (l = i.length, r = 0; r < l; r++) {
      o = i[r], u.push(new a().setValue(this.options._const.action, this.options._const.addAttribute).setValue(this.options._const.route, n).setValue(this.options._const.name, o).setValue(this.options._const.value, t.attributes[o]));
    }
    return u;
  }, D.prototype.findInnerDiff = function (e, t, n) {
    var o = e.childNodes ? e.childNodes.slice() : [],
      s = t.childNodes ? t.childNodes.slice() : [],
      i = Math.max(o.length, s.length),
      l = Math.abs(o.length - s.length),
      c = [],
      r = 0;
    if (!this.options.maxChildCount || i < this.options.maxChildCount) {
      var u = e.subsets && e.subsetsAge--,
        h = u ? e.subsets : e.childNodes && t.childNodes ? function (e, t) {
          for (var n = e.childNodes ? e.childNodes : [], o = t.childNodes ? t.childNodes : [], s = m(n.length, !1), i = m(o.length, !1), a = [], l = !0, c = function c() {
              return arguments[1];
            }; l;) {
            (l = p(n, o, s, i)) && (a.push(l), Array.apply(void 0, new Array(l.length)).map(c).forEach(function (e) {
              return t = e, s[l.oldValue + t] = !0, void (i[l.newValue + t] = !0);
              var t;
            }));
          }
          return e.subsets = a, e.subsetsAge = 100, a;
        }(e, t) : [];
      if (h.length > 0 && (c = this.attemptGroupRelocation(e, t, h, n, u)).length > 0) return c;
    }
    for (var _ = 0; _ < i; _ += 1) {
      var V = o[_],
        g = s[_];
      l && (V && !g ? "#text" === V.nodeName ? (c.push(new a().setValue(this.options._const.action, this.options._const.removeTextElement).setValue(this.options._const.route, n.concat(r)).setValue(this.options._const.value, V.data)), r -= 1) : (c.push(new a().setValue(this.options._const.action, this.options._const.removeElement).setValue(this.options._const.route, n.concat(r)).setValue(this.options._const.element, f(V))), r -= 1) : g && !V && ("#text" === g.nodeName ? c.push(new a().setValue(this.options._const.action, this.options._const.addTextElement).setValue(this.options._const.route, n.concat(r)).setValue(this.options._const.value, g.data)) : c.push(new a().setValue(this.options._const.action, this.options._const.addElement).setValue(this.options._const.route, n.concat(r)).setValue(this.options._const.element, f(g))))), V && g && (!this.options.maxChildCount || i < this.options.maxChildCount ? c = c.concat(this.findNextDiff(V, g, n.concat(r))) : d(V, g) || (o.length > s.length ? ("#text" === V.nodeName ? c.push(new a().setValue(this.options._const.action, this.options._const.removeTextElement).setValue(this.options._const.route, n.concat(r)).setValue(this.options._const.value, V.data)) : c.push(new a().setValue(this.options._const.action, this.options._const.removeElement).setValue(this.options._const.element, f(V)).setValue(this.options._const.route, n.concat(r))), o.splice(_, 1), _ -= 1, r -= 1, l -= 1) : o.length < s.length ? (c = c.concat([new a().setValue(this.options._const.action, this.options._const.addElement).setValue(this.options._const.element, f(g)).setValue(this.options._const.route, n.concat(r))]), o.splice(_, 0, {}), l -= 1) : c = c.concat([new a().setValue(this.options._const.action, this.options._const.replaceElement).setValue(this.options._const.oldValue, f(V)).setValue(this.options._const.newValue, f(g)).setValue(this.options._const.route, n.concat(r))]))), r += 1;
    }
    return e.innerDone = !0, c;
  }, D.prototype.attemptGroupRelocation = function (e, t, n, o, s) {
    for (var i, l, c, r, u, d, p = function (e, t, n) {
        var o = e.childNodes ? m(e.childNodes.length, !0) : [],
          s = t.childNodes ? m(t.childNodes.length, !0) : [],
          i = 0;
        return n.forEach(function (e) {
          for (var t = e.oldValue + e.length, n = e.newValue + e.length, a = e.oldValue; a < t; a += 1) {
            o[a] = i;
          }
          for (var l = e.newValue; l < n; l += 1) {
            s[l] = i;
          }
          i += 1;
        }), {
          gaps1: o,
          gaps2: s
        };
      }(e, t, n), _ = p.gaps1, V = p.gaps2, g = Math.min(_.length, V.length), v = [], N = 0, b = 0; N < g; b += 1, N += 1) {
      if (!s || !0 !== _[N] && !0 !== V[N]) {
        if (!0 === _[N]) {
          if ("#text" === (r = e.childNodes[b]).nodeName) {
            if ("#text" === t.childNodes[N].nodeName) {
              if (r.data !== t.childNodes[N].data) {
                for (d = b; e.childNodes.length > d + 1 && "#text" === e.childNodes[d + 1].nodeName;) {
                  if (d += 1, t.childNodes[N].data === e.childNodes[d].data) {
                    u = !0;
                    break;
                  }
                }
                if (!u) return v.push(new a().setValue(this.options._const.action, this.options._const.modifyTextElement).setValue(this.options._const.route, o.concat(N)).setValue(this.options._const.oldValue, r.data).setValue(this.options._const.newValue, t.childNodes[N].data)), v;
              }
            } else v.push(new a().setValue(this.options._const.action, this.options._const.removeTextElement).setValue(this.options._const.route, o.concat(N)).setValue(this.options._const.value, r.data)), _.splice(N, 1), g = Math.min(_.length, V.length), N -= 1;
          } else v.push(new a().setValue(this.options._const.action, this.options._const.removeElement).setValue(this.options._const.route, o.concat(N)).setValue(this.options._const.element, f(r))), _.splice(N, 1), g = Math.min(_.length, V.length), N -= 1;
        } else if (!0 === V[N]) "#text" === (r = t.childNodes[N]).nodeName ? (v.push(new a().setValue(this.options._const.action, this.options._const.addTextElement).setValue(this.options._const.route, o.concat(N)).setValue(this.options._const.value, r.data)), _.splice(N, 0, !0), g = Math.min(_.length, V.length), b -= 1) : (v.push(new a().setValue(this.options._const.action, this.options._const.addElement).setValue(this.options._const.route, o.concat(N)).setValue(this.options._const.element, f(r))), _.splice(N, 0, !0), g = Math.min(_.length, V.length), b -= 1);else if (_[N] !== V[N]) {
          if (v.length > 0) return v;
          if (c = n[_[N]], (l = Math.min(c.newValue, e.childNodes.length - c.length)) !== c.oldValue) {
            i = !1;
            for (var y = 0; y < c.length; y += 1) {
              h(e.childNodes[l + y], e.childNodes[c.oldValue + y], [], !1, !0) || (i = !0);
            }
            if (i) return [new a().setValue(this.options._const.action, this.options._const.relocateGroup).setValue("groupLength", c.length).setValue(this.options._const.from, c.oldValue).setValue(this.options._const.to, l).setValue(this.options._const.route, o)];
          }
        }
      } else ;
    }
    return v;
  }, D.prototype.findValueDiff = function (e, t, n) {
    var o = [];
    return e.selected !== t.selected && o.push(new a().setValue(this.options._const.action, this.options._const.modifySelected).setValue(this.options._const.oldValue, e.selected).setValue(this.options._const.newValue, t.selected).setValue(this.options._const.route, n)), (e.value || t.value) && e.value !== t.value && "OPTION" !== e.nodeName && o.push(new a().setValue(this.options._const.action, this.options._const.modifyValue).setValue(this.options._const.oldValue, e.value || "").setValue(this.options._const.newValue, t.value || "").setValue(this.options._const.route, n)), e.checked !== t.checked && o.push(new a().setValue(this.options._const.action, this.options._const.modifyChecked).setValue(this.options._const.oldValue, e.checked).setValue(this.options._const.newValue, t.checked).setValue(this.options._const.route, n)), o;
  };
  var T = {
      debug: !1,
      diffcap: 10,
      maxDepth: !1,
      maxChildCount: 50,
      valueDiffing: !0,
      textDiff: function textDiff(e, t, n, o) {
        e.data = o;
      },
      preVirtualDiffApply: function preVirtualDiffApply() {},
      postVirtualDiffApply: function postVirtualDiffApply() {},
      preDiffApply: function preDiffApply() {},
      postDiffApply: function postDiffApply() {},
      filterOuterDiff: null,
      compress: !1,
      _const: !1,
      document: !("undefined" == typeof window || !window.document) && window.document
    },
    O = function O(e) {
      var t = this;
      if (void 0 === e && (e = {}), this.options = e, Object.entries(T).forEach(function (e) {
        var n = e[0],
          o = e[1];
        Object.prototype.hasOwnProperty.call(t.options, n) || (t.options[n] = o);
      }), !this.options._const) {
        var n = ["addAttribute", "modifyAttribute", "removeAttribute", "modifyTextElement", "relocateGroup", "removeElement", "addElement", "removeTextElement", "addTextElement", "replaceElement", "modifyValue", "modifyChecked", "modifySelected", "modifyComment", "action", "route", "oldValue", "newValue", "element", "group", "from", "to", "name", "value", "data", "attributes", "nodeName", "childNodes", "checked", "selected"];
        this.options._const = {}, this.options.compress ? n.forEach(function (e, n) {
          return t.options._const[e] = n;
        }) : n.forEach(function (e) {
          return t.options._const[e] = e;
        });
      }
      this.DiffFinder = D;
    };
  O.prototype.apply = function (e, t) {
    return function (e, t, n) {
      return t.every(function (t) {
        return o(e, t, n);
      });
    }(e, t, this.options);
  }, O.prototype.undo = function (e, t) {
    return i(e, t, this.options);
  }, O.prototype.diff = function (e, t) {
    return new this.DiffFinder(e, t, this.options).init();
  };
  var C = function C(e) {
    var t = this;
    void 0 === e && (e = {}), this.pad = "│   ", this.padding = "", this.tick = 1, this.messages = [];
    var n = function n(e, _n) {
      var o = e[_n];
      e[_n] = function () {
        for (var s = [], i = arguments.length; i--;) {
          s[i] = arguments[i];
        }
        t.fin(_n, Array.prototype.slice.call(s));
        var a = o.apply(e, s);
        return t.fout(_n, a), a;
      };
    };
    for (var o in e) {
      "function" == typeof e[o] && n(e, o);
    }
    this.log("┌ TRACELOG START");
  };
  return C.prototype.fin = function (e, t) {
    this.padding += this.pad, this.log("├─> entering " + e, t);
  }, C.prototype.fout = function (e, t) {
    this.log("│<──┘ generated return value", t), this.padding = this.padding.substring(0, this.padding.length - this.pad.length);
  }, C.prototype.format = function (e, t) {
    return function (e) {
      for (e = "" + e; e.length < 4;) {
        e = "0" + e;
      }
      return e;
    }(t) + "> " + this.padding + e;
  }, C.prototype.log = function () {
    var e = Array.prototype.slice.call(arguments),
      t = function t(e) {
        return e ? "string" == typeof e ? e : e instanceof HTMLElement ? e.outerHTML || "<empty>" : e instanceof Array ? "[" + e.map(t).join(",") + "]" : e.toString() || e.valueOf() || "<unknown>" : "<falsey>";
      };
    e = e.map(t).join(", "), this.messages.push(this.format(e, this.tick++));
  }, C.prototype.toString = function () {
    for (var e = "└───"; e.length <= this.padding.length + this.pad.length;) {
      e += "×   ";
    }
    var t = this.padding;
    return this.padding = "", e = this.format(e, this.tick), this.padding = t, this.messages.join("\n") + "\n" + e;
  }, e.DiffDOM = O, e.TraceLogger = C, e.nodeToObj = v, e.stringToObj = A, e;
}({});
