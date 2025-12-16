// Code (c) Kieran Metcalfe / Ascent Creative 2023

$.ascent = $.ascent?$.ascent:{};

var FilterView = {

    initialState: null,
    qsTargets: '.filter-view, .filter-qs-include',
    baseUri: '',
    forceUri: false,
        
		_init: function () {
            
			var self = this;
			this.widget = this;

            let forceUri = $(this.element).data('force-uri');
            if(forceUri != undefined) {
                if(forceUri) {
                   this.forceUri = true;
                } 
            } else {
                // alert('undef');
            }
            

            // filter options have been changed
            // - should reload first page
            $(this.element).on('filters-updated', function(e) {
                self.loadPage(e);
            });

            // hijack pagination links:
            $(this.element).on('click', '.filter-paginator .page-link', function(e) {
                // alert('page link');
                let page = $(e.currentTarget).data('target-page');

                //set the hidden page number field so the target variable is set in the 
                // ajax request
                $(self.element).find('.filter-paginator INPUT.page').val(page);

                self.loadPage(e);

                return false;
            });

            $(this.element).on('click', '.filter-item.load-in-place, .filter-item.retain-filters', function(e) {
                e.preventDefault();
                
                let url2 = $(this).find('a').attr('href');

                window.location = url2 + window.location.search;

                return;
                // alert('load item');
                $(self.element).addClass('filter-updating');
                
                let url = $(this).find('a').attr('href');
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

                }).then(function() {
                    $(self.element).removeClass('filter-updating');
                });


            });

            // user requested a copy operation (on a DataTable)
            $(this.element).on('request-copydata', function(e, slug, triggerEvent) {
                self.copyData(slug, triggerEvent);
            });

            // user requested an data export:
            $(this.element).on('click', '.filter-export', function() {
                self.exportData();
            });


            $(this.element).on('click', '.filter-copy-data', function(e) {
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
        loadPage: function(e, page = 0) {

            // calculate the query string based on the current field selection
            // let qs = '?' + $(this.element).find("INPUT, SELECT").not('[name=_token]').serialize();
            
            // ability to add extra elements to the qs
            // - default is to find ALL .filter-views on the page:
            // - plus anything classed as '.filter-qs-include'
            let qs = '?' + $(this.qsTargets).find("INPUT, SELECT").not('[name=_token]').serialize();

            if(this.forceUri && window.location.pathname != this.baseUri) {
                // if we're not viewing the main URL (such as an item show view), just load the URL
                // (would be nicer to manipulate the the DOM, but that comes with a world of problems for now)
                // alert('here');
                window.location = this.baseUri + qs;
                return;
            }
    
            // If we're already on the right page, do this bit via ajax
            let self = this;
            $(self.element).addClass('filter-updating');

            var filterData = new FormData($(this.element)[0]);
            filterData.append('config', $(this.element).data('filtersetup'));

            // we need to detect all the filter UIs 
            // and get their config information (itemBlade for example). The Ajax call will render each view into the JSON reply

            let pages = {};
            $(this.element).find('.filter-page').each(function(idx) {
                console.log('page config:', $(this).data('config'));
                pages[$(this).attr('id')] = $(this).data('config');
            });
            filterData.append('pages', JSON.stringify(pages));

            let counters = {};
            $(this.element).find('.filter-counter').each(function(idx) {
                counters[$(this).attr('id')] = $(this).data('config');
            });
            filterData.append('counters', JSON.stringify(counters));

            let paginators = {};
            $(this.element).find('.filter-paginator').each(function(idx) {
                paginators[$(this).attr('id')] = $(this).data('config');
            });
            filterData.append('paginators', JSON.stringify(paginators));

            let filterfields = {};
            $(this.element).find('.filter-field').each(function(idx) {
                console.log(idx);
                filterfields[$(this).attr('id')] = $(this).data('config');
            });
            filterData.append('fields', JSON.stringify(filterfields));

            // perform the lookup            
            $.ajax({ 
                url: this.baseUri , //+ "/loadpage",
                type: 'post',  
                data: filterData,
                contentType: false,
                processData: false,
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            }).done(function(data) {

                $('.filter-itemcontent').html('');

                self.setState(data);

                // pushState:
                // call the History API to update the URL in the browser:
                // or, maybe this should be done by the display when the first page is loaded, so the results can be stored?
                // let href = window.location.pathname;
                let uri = window.location.pathname;
                if(this.forceUri) {
                    let uri = self.baseUri;
                }
                
                $(document).statemanager('pushState', uri+qs);
                // history.pushState(self.collectState(), 'title', uri + qs);

                // self.storeState();

                $(document).trigger('filter-page-loaded');

            }).fail(function(data) {
                alert('fail');
            }).then(function() {
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
        collectState: function() {

            let data = {};
            
            let pages = {};
            $(this.element).find('.filter-page').each(function(idx) {
                let id = $(this).attr('id');
                pages[id] = $(this).html();
            });
            data.pages = pages;

            let paginators = {};
            $(this.element).find('.filter-paginator').each(function(idx) {
                let id = $(this).attr('id');
                paginators[id] = $(this).html();
            });
            data.paginators = paginators;

            let counters = {};
            $(this.element).find('.filter-counter').each(function(idx) {
                let id = $(this).attr('id');
                counters[id] = $(this).html();
            });
            data.counters = counters;

            let fields = {};
            $(this.element).find('.filter-field').each(function(idx) {
                let id = $(this).attr('id');
                fields[id] = $(this).html();
            });
            data.fields = fields;

            let itemcontent = {};
            $(this.element).find('.filter-itemcontent').each(function(idx) {
                let id = $(this).attr('id');
                itemcontent[id] = $(this).html();
            });
            data.itemcontent = itemcontent;

            console.log(data);
            return data;

        },


        // Updates the UI after a page load operation (or a popstate change)
        setState: function(data) {

            console.log('setting ui state');

            // let elms = $(this.element).find('.filter-page');
            // console.log(data.pages.length);
            // for(let iPage = 0; iPage < data.pages.length; iPage++) {
            //     console.log('iPage: ' + iPage);
            //     $(elms[iPage]).html(data.pages[iPage]);
            // }

            for(const id in data.pages) {
                console.log(id);
                $(this.element).find('.filter-page#' + id).html(data.pages[id]);
            };

            for(const id in data.paginators) {
                $(this.element).find('.filter-paginator#' + id).html(data.paginators[id]);
            }

            for(const id in data.counters) {
                console.log(id);
                console.log(data.counters[id]);
                $(this.element).find('.filter-counter#' + id).html(data.counters[id]);
            }

            for(const id in data.fields) {
                $(this.element).find('.filter-field#' + id).html(data.fields[id]);
            }

            for(const id in data.itemcontent) {
                $(this.element).find('.filter-itemcontent#' + id).html(data.itemcontent[id]);
            }

        },


        // Handle an ajax call to fetch data and copy to the clipboard on success
        // Also display a 'copied' toast.
        copyData: function(col, triggerEvent) {

            let self = this;

            // $(this.element).css('opacity', 0.2);
            $(this.element).addClass('filter-updating');

            var filterData = new FormData($(this.element)[0]);
            filterData.append('config', $(this.element).data('filtersetup'));

            // console.log(filterData);
            // console.log($(this.element).serialize());

            // does an AJAX request to get ALL pages of data, not just current.
            var url = this.baseUri + '/copy';

            if (col != '') {
                url = url + '/' + col;
            }

            $.ajax({ 
                url: url,
                // url: this.baseUri + '/copy',
                type: 'post',  
                data: filterData,
                contentType: false,
                processData: false,
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            }).done(function(data) {

                // write the data to the clipboard
                // NB :: HTTPS required for this to work,

                console.log(data);
                
                

                let obj = {};

                for(format in data.data) {
                    obj[format] = new Blob([data.data[format]], { type: format });
                }

                if (navigator.clipboard) {
                    navigator.clipboard.write([
                        new ClipboardItem(obj),
                    ]).then((value) => {
                            // console.log(value);
                    });
                }

                let toast = $(data.toast);
                if(toast) {
                    $('body').append(toast);

                    // Get positioning Rects
                    let causer = triggerEvent.target;
                    let rect = causer.getBoundingClientRect();
                    let tRect = toast[0].getBoundingClientRect();

                    // delete from the DOM once faded out
                    $(toast).on('hidden.bs.toast', function () {
                        $(toast).remove();
                    })

                    // Position the toast near the calling button. 
                    $(toast).css('top', (rect.bottom) + window.scrollY + 5 + 'px').css('left', (rect.right - tRect.width) - 5 + 'px')
                            .toast('show');
                }

                let modal = $(data.modal);
                if(modal) {
                    $('body').append(modal);
                    $(modal).on('hidden.bs.modal', function () {
                        $(modal).remove();
                    });
                    $(modal).modal('show');
                }

                // $(self.element).css('opacity', 1);
                $(self.element).removeClass('filter-updating');


            }).fail(function(data) {
                // need to be more helpful here...
                alert('Unable to copy data');
            });


        },

        // Perform a data export. Essentially just a get request with the current QueryString
        exportData: function(e, col, triggerEvent) {
            window.location = this.baseUri + '/export' + window.location.search;
        }

    
}

$.widget('ascent.filterview', FilterView);
$.extend($.ascent.FilterView, {
		 
		
}); 

