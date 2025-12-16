<?php

namespace AmplifyCode\Filter\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Database\Eloquent\Builder;
use App\Http\Controllers\Controller;

use \Illuminate\Support\Facades\Crypt;

use AmplifyCode\Filter\FilterManager;

class FilterController extends Controller {

    public function loadpage(FilterManager $fm) {

        /**
         * Process the filter request
         */
        $config = (array) json_decode(Crypt::decryptString(request()->config));

        $items = $fm->getPage(request()->all(), request()->get($fm->getPageVariable()));

        // only if paginated:
        if($items instanceof \Illuminate\Pagination\LengthAwarePaginator) {

            // paginators will need to use the path from the referer...
            $url = parse_url($_SERVER['HTTP_REFERER']);
            $items->setPath($url['path']);
            // ... the parameters from this request (not the full query string)
            $items->appends(request()->except(['_token', 'config', 'pages', 'counters', 'paginators']));

        }
    
        // render the various widgets as needed
        $output = [];

        // Pull out the query variables for the registered Filters in the request.
        // These will be passed into the page blades for if the system is to maintain them 
        // across page requests.
        $query_vars = [];
        foreach($fm->getFieldNames() as $fld) {
            $query_vars[$fld] = request()->$fld;
        }

        $pages = (array) json_decode(request()->pages, true);
        foreach($pages as $page=>$pageConfig) {
            $pageConfig = (array) json_decode(Crypt::decryptString($pageConfig));
            $output['pages'][$page] = view($pageConfig['pageBlade'] ?? 'filter::page-inner', ['items'=>$items, 'filterManager'=>get_class($fm), 'config'=>$config, 'blade'=>$pageConfig['itemBlade'], 'filters'=>$query_vars])->render();
        } 

        $counters = (array) json_decode(request()->counters, true);
        foreach($counters as $counter=>$counterConfig) {
            $counterConfig = (array) json_decode(Crypt::decryptString($counterConfig));
            $output['counters'][$counter] = view('filter::counter-inner', ['items'=>$items, 'fm'=>$fm, 'config'=>$config, 'attributes'=>$counterConfig])->render();
        } 

        $paginators = (array) json_decode(request()->paginators, true);
        foreach($paginators as $paginator=>$paginatorConfig) {
            $paginatorConfig = (array) json_decode(Crypt::decryptString($paginatorConfig));
            $output['paginators'][$paginator] = view('filter::paginator-inner', ['items'=>$items, 'fm'=>$fm, 'config'=>$config, 'blade'=>$paginatorConfig['blade'], 'attributes'=>$paginatorConfig])->render();
        } 

        

        $fields = (array) json_decode(request()->fields, true);
        foreach($fields as $field=>$fieldConfig) {
            $fieldConfig = (array) json_decode(Crypt::decryptString($fieldConfig));
            $fieldConfig['items'] = $items;
            $fieldConfig['filterManager'] = $fm;
            $fieldConfig['config'] = $config;
            $output['fields'][$field] = view('filter::field-inner', $fieldConfig)->render();
        } 

        // return the JSON data
        return $output;

    }

    public function export(FilterManager $fm) {

        // $this->authorize('export');

        return $fm->export();
        

    }

  

}
