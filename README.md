# Filter UI for Laravel Models

This package provides a UI library with backend integration for showing and filtering model data on websites. One simple use case would be product catalogues which update when categories are selected, but other examples exist.

Filter was originally developed by Kieran Metcalfe of Ascent Creative until his death in July 2025. This fork is maintained by Colin Cameron of Amplify Code Ltd in order to further develop and maintain websites that rely on this package.

## Installation

 - `composer require ascentcreative\filter` - although the repository location may need to be added to you composer.json file.

## Core concepts

This package leans heavily on mapping fields in the UI to scopes defined on a Laravel Model. This mapping takes place within a "FilterManager" class which applies all the neccessary scopes and builds the relevent Eloquent queries. Through the use of some Route Macros, requests are sent to the application via Ajax and updated datasets and other UI elements are returned as HTML fragments. 

## Writing a FilterManager class

FilterManager classes extend `AscentCreative\Filter\FilterManager`. A very simple example would be:

```
namespace App\Filter;

use AscentCreative\Filter\FilterManager;
use App\Models\Product;

class ProductFilterManager extends FilterManager {

    public $default_sort = 'title';

    public $pagesize = 100;

    public function boot() {
        // currently required
        $this->setFilterWrapper('');

        // maps incoming 'title' request data to Product::scopeByTitle($builder, $data);
        $this->registerFilter('title', 'byTitle');

        // maps incoming 'theme' request data to Product::scopeByTheme($builder, $data);
        $this->registerFilter('theme', 'byTheme');

        // Sorters use the incoming 'sort' request field.
        // - if value is 'title', we'll apply Product::scopeOrderByTitle($builder, $value)
        $this->registerSorter('title', 'orderByTitle');
        // - if value is 'price', we'll apply Product::scopeOrderByPrice($builder, $value)
        $this->registerSorter('price', 'orderByPrice');
    }

    public function buildQuery() {
        // Return a QueryBuilder object from the model - you can apply any scopes / filters etc here
        // which you may need
        return Product::query();
    }

}
```

Next, create a `Route::filter` item in your routes file which will set up the Ajax endpoints for this FilterManager:

```
Route::filter('products', \App\Filter\ProductFilterManager::class);
```
The first parameter is the URL segment to use. Note that this does not use `/products` directly, but a number of sub-routes under that segment, so that URL is still available. In fact, it is probably besst used for your main products page, although that's not essential. 

### Advanced - Exporting Data

### Advanced - Copying Data

## UI Components

The next step is to build your Filter UI. This package contains a number of blade components which provide most of the elements needed, some are required, others may be optional depending on your use case.

A basic filter UI might look like:

```
/resources/views/products.blade.php


 <x-filter-view filterManager="{{ \App\Filter\ProductFilterManager::class }}">

    <x-filter-bar>
        {{-- Filter fields go in here --}}
    </x-filter-bar>

    {{-- Displays a text label of "Showing 0 to 25 of 1000 products" --}}
    <x-filter-counter unit="product"/>

    {{-- Displays a page of results, each item usiing the /resources/views/filter/product.blade.php file --}}
    <x-filter-page itemBlade="filter.product"/>

    {{-- Creates a paginator for multipage results --}}
    <x-filter-paginator blade="bootstrap-4"  />

 </x-filter-view>


```

#### `<x-filter-view>`
Defines the area of the DOM which will respond to user input and display results from the FilterManager. 

**Attributes**
 - `filterManager` - Required - The classname of the filter to connect to
 - `class` - Passes HTML/CSS class names to the DIV
 - `style` - Passes CSS Styles to the DIV


#### `<x-filter-bar>`
Designed to be the area where the filter options are displayed. Any HTML fields in this component will be used to trigger updates. 
If you need to add a field which does not trigger an update, set the `data-filter-ignore="1"` attribute

**Attributes**
 - `class` - Passes HTML/CSS class names to the DIV
 - `style` - Passes CSS Styles to the DIV


#### `<x-filter-counter>`
Creates a Human-readble string summarising the number of records returned.

**Attributes**
 - `filterManager` - Optional - The classname of the filter to connect to
 - `unit` - Required - a singular string used to label the type of record. This will use Str::plural if needed.
 - `class` - Passes HTML/CSS class names to the DIV
 - `style` - Passes CSS Styles to the DIV

#### `<x-filter-page>`
The area where the results will be displayed

**Attributes**
 - `filterManager` - Optional - The classname of the filter to connect to
 - `itemBlade` - Required - the blade to use to render an individual model result (accessible via `$item`)
 - `pageBlade` - Optional - a blade to use to render the page of results. The returned items will be acessible as `$items`
 - `class` - Passes HTML/CSS class names to the DIV
 - `style` - Passes CSS Styles to the DIV

#### `<x-filter-paginator>`
Creates a paginator to navigate between pages of results

**Attributes**
 - `filterManager` - Optional - The classname of the filter to connect to
 - `blade` - Optional - the blade to use. Defaults to a Bootstrap4 paginator.
 - `class` - Passes HTML/CSS class names to the DIV
 - `style` - Passes CSS Styles to the DIV

#### `<x-filter-pagesize>`
Creates a dropdown allowing the number of results per page to be changed in the UI


## Important note about the FilterManager attribute on components.
If the Filter components are all on the same Blade file, the components will be able to inherit the FilterManager class using `@aware`. 
However, if any components are inserted in an @include for example, you will need to explicitly set the FilterManager attribute on those components.
This will have no performance impact as the FilterManager is loaded as a singleton instance and the query only performed once per request.

## Filter Fields / Options

While noted above that any HTML field element can be used as a filter trigger within the `x-filter-bar`, there are a some pre-built options which provide some reusable functionality.

#### `<x-filter-field>`

This probably needs a better name as 'field' is too generic. Essentially, this component is designed to present a list of options (Tags, Themes, etc) which a user would select to narrow down their search. The component displays a list of checkboxes and can also incude an indication of how many matching records would be returned if that item was selected. It can even combine that across multiple instances of the component looking at different option sets.

An example of this component in use would be:

```

<x-filter-bar>

   ...
    <h3>Filter By Theme:</h3>
    <x-filter-field 
       filterName="theme"
       model="App\Models\Theme"
       relation="products"
       labelField="label"
       idField="id" 
       :optionScopes="['sortedByLabel']"
        />

     ...

</x-filter-bar>

```

In this example, the field would show a list of themes, sorted by their label, with a count of the number of products in each. 

**Attributes**
 - `filterName` - Required - this is essentially the HTML field name, and maps to the name given in a `$this->registerFilter(...)` call when booting the FilterManager
 - `model` - Required - the name of the Model class used to source the options
 - `relation`- Optional (but needed if you want to show the count of items that would be returned). It is the name of the relation from the class in the Model attribute to the main Model we're filtering.
 - `labelField` - Optional - the field on the Theme model to display
 - `idField` - Optional - the field on the Theme model to use as the ID for filtering on. Unlikley to need to change this.
 - `optionScopes` - Optional - an array of scopes to apply to the Theme model (in this case), to either limit or sort the number of options displayed in any way that may be needed. Note that the values given here should be in the format of the function you apply to the QueryBuilder - so `sortedByLabel` => `$query->sortedByLabel()` => `Theme::scopeSortedByLabel($builder)`.

#### `<x-filter-tags>`

Another component which allows a similar means of filtering is the Filter Tags component. Again, the name may be slightly vague, but in this case, rather than presenting a long list of checkboxes for a user to select from, the user is presented with a type-ahead field which allows them to search for, and add one or more "tags" to the component. These are the values which are then used by the filter.

```
 <x-filter-tags
    title="Theme"
    filterName="theme"
    :value="request()->theme"
    model="App\Models\Theme"
    source="{{ route('themes.autocomplete') }}"
    labelField="label"
    idField="id" 
            />
```

The main requirement here is that the source URL is compatible with [jQueryUI's `autocomplete()` widget](https://jqueryui.com/autocomplete/). The [ascentcreative/cms](https://github.com/ascentcreative/cms) package contains an `Autocompleteable` trait and `Route::autocomplete` macro which make this straightforward to set up.



## The DataTableBuilder

The datatable builder is a specific implementation of the FilterManager which is designed to render as a Bootstrap 4 table. Rather than specifying a grid or other layout for the returned models, the Datatable:
 - Builds rows for each model
 - Uses Column classes to define the data each row should show
 - Implements column headers which allow for sorting and filtering options
 - It is possible to combine a DataTable with additional filters in a Filter-Bar component for extra filtering

A simple example UI with a DataTable would be as follows:

```
/resources/views/productstable.blade.php

 <x-filter-view filterManager="{{ \App\Filter\ProductTable::class }}">

    <x-filter-datatable
        id="products-table"
    />

   <x-filter-paginator />
           
</x-filter-view>

```

The DataTableBuilder class would be as follows:

```

<?php

namespace App\Filter;

use Illuminate\Support\Facades\DB;

use AscentCreative\Filter\DataTableBuilder;
use AscentCreative\Filter\DataTable\Column;

use App\Models\Product;

class Product extends DataTableBuilder {

    // Booting is optional here, but if you do, ensure the parent class also boots
    public function boot() {
       
        parent::boot();

        // You only need to explicitly register filters which aren't defined within the table's columns
        // column filters are registered automatically.
       m//$this->registerFilter('field', 'scope');
      
    }

    // As with a normal filter manager, you must create a base query
    public function buildQuery() {
        // Return a QueryBuilder object from the model - you can apply any scopes / filters etc here
        // which you may need
        return Product::query();
    }


     // Return an array of Column instances:
     public function columns() : array {

        return [

            // Create a column titled "Product" which shows the product title property
            Column::make('Product', 'title'),

            // Create a column called "Type"
            Column::make('Type')
                ->valueRelationshipProperty('type','name') // Gets the 'name' from a relationship called 'type'
                ->filterScope('byType') // adds a filter to the column linked to Product::scopeByType($builder, $data)
                ->filterBlade("product.filters.types") // the filter will display a blade where the user can select the types to filter by
                ->width(175), // set a column width

             ... add other columns as necessary
           
        ];

    }

}


```

### The Column Class

Columns are created using the static `Column::make($name, $value = null)` function. All other methods are set up for chaining using a Fluent interface and can be added in any order.

There are 3 broad sets of fluent functions for configuring the value of the column, the filter associated with the column and the sort options.

#### Value methods

**valueProperty($property)**
Sets the value to either a named property of the model. The second parameter of the `::make()` function (if set) is passed to this function.
Alternatively, a `\Closure` can be passed in: 
```
->valueProperty(function($item) {
   return $item->title;
});
```

**valueRelationshipProperty($relation, $property)**
Displays a value from an Eloquent relationship. The $relation can use dot notation to drill down through various models if needed.

**valueBlade($path)**
The value will simply load a blade file. The model for the row is available in the `$item` variable

**valueCount($relation)**
Returns the count of the items on the given Eloquent relation: `->valueCount('orders)`

**valueMax($relation, $property)**
Returns the maximum value from given property of the model on the specified Eloquent relationship: `->valueMax('order', 'quantity`)`

**valueSum($relationm, $property)**
Sums the given property from the specified Eloquent relationship: `->valueSum('orders', 'total')`


#### Filter Methods

Usually both of these functions would be used, or neither.

**filterScope($scope)**
Sets the name of the model's scope function to use when filtering by this column
`->filterScope('byStatus')`

**filterBlade($blade, $options=null, $props=null)**
Defines a blade which is used to render the filter's options and collect data from the user.

`->filterBlade('filter::ui.filters.checkboxes', ['live'=>'Live Products', 'sold_out'=>"Sold Out"])`

There are some pre-defined blades in /resources/views/ui/filters:
 - checkboxes.blade.php - renders the $options array as a list of checkboxes
 - radiobuttons.blade.php - renders the $options array as a list of radiobuttons
 - text.blade.php - gives a free text input
When writing a custom blade, the $props parameter can be used to pass in any additional items needed.


#### Sort Methods

There are a few options for configuring how a column's sorting works:

**sortableBy($property)**
A simple sorter by the value of a given property on the model. 
`->sortableBy('title')`
Equates to adding `order by title` clause to the query. (The direction will toggle with each click on the column's sort icon)

**sortScope($scope)**
(Apologies for the inconsistent naming of this function!)
Applies an Elqouent scope to the query. This is particularly useful when sorting on a value from a Relationship as you may need to dynamically appply joins or other suqueries.
`->sortScope('byTotalSales')`


