<?php
namespace AmplifyCode\Filter;

use Illuminate\Support\Facades\Log;

use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Schema;

abstract class FilterManager {

    static private $instances = array();

    protected $routes = [];
    // need to somehow register the filters and sorters
    // I'm thinking by fieldname in the request data and the scope name
    
    // should we also grab a wrapper field name?
    // i.e. cfilters[themes] => wrapper[field]

    // allow a global wrapper to be set, but each individual registration might override it?

    public $filter_wrapper = 'filter';
    public $sorter_field = 'sort';

    public $page_variable = 'page';

    private $filters = [];
    private $filter_additional = [];
    private $statutoryFilters = [];
    private $sorters = [];

    protected $pagesize = 24;

    public $defaults = [];
    public $default_sort = null;

    public $filterdata; // the combined, functional data being used (may be defaults or supplied params);

    protected $builder;


    private function __construct() {

        $this->boot();
        // $this->builder = $this->buildQuery();
        $this->register();

    }

    public function boot() {

    }

    public function register() {

    }

    abstract function buildQuery();



    public function setFilterWrapper($wrapper) {
        $this->filter_wrapper = $wrapper;
        return $this;
    }

    public function setSorterField($field) {
        $this->sorter_field = $field;
        return $this;
    }


    /**
     * Register a new filter
     * param: $field - the name of the field
     * param: $socpe - the eloquent scope name to apply on the model - i.e. scopeByTheme = 'byTheme';
     * param: $wrapper - override the wrapper for this field
     * param: ...$additional - array of extra fields that the filter scope requires (will be passed as parameters to the scope function)
     */
    public function registerFilter($field, $scope, $wrapper=null, ...$additional) {

        $this->filters[$field] = $scope;

        $this->filter_additional[$field] = $additional;

        return $this;

    }

    public function getFieldNames() {
        return array_keys($this->filters);
    }


    /**
     * Register a new statutory filter
     * param: $socpe - the eloquent scope name to apply on the model - i.e. scopeByTheme = 'byTheme';
     * No params needed - it's always applied.
     */
    public function registerStatutoryFilter($scope) {

        $this->statutoryFilters[] = $scope;

        return $this;

    }

    /**
     * Register a new sorter
     * param: $field - the name of the field
     * param: $socpe - the eloquent scope name to apply on the model - i.e. scopeByTheme = 'byTheme';
     * param: $wrapper - override the wrapper for this field
     */
    public function registerSorter($field, $scope, $wrapper=null) {
 
        // dump($field);
        // dump($scope);

        $this->sorters[$field] = $scope;

        return $this;

    }

   

    public function apply($data=null) {
        
        $query = $this->buildQuery();

        return $this->applyToQuery($query, $data);

    }


    public function applyToQuery($query, $data, $filtersOnly=false) {

        if(isset($data['pagesize'])) {
            $this->pagesize = $data['pagesize'];
        }

        // Need to work out whether to use defaults or not.
        // It's possible the user has deselected everything...
        // $data = $data ?? $this->defaults; //request()->all();

        // dump($data);

         // the keys from these arrays represent the fieldnames we're looking out for.
        // $fields = array_merge(array_keys($this->filters), [$this->sorter_field]); ///array_keys($this->sorters));

        // dump($fields);

        // if none of these are set in the incoming data, then we use the defaults.
        // if just one is set, we bin the defaults.
        $data = collect($data)->intersectByKeys(array_merge($this->filters, [$this->sorter_field => ''] ));
        if(count($data) == 0) {
            $data = $this->defaults;
        }

        // also need to make these settings available to the UI
        //  - pass them into a property which will be shared with the blade components
        $this->filterdata = $data;


        foreach($this->statutoryFilters as $key=>$scope) {
            $query->$scope();
        }

       

        $wrapper = $this->filter_wrapper;
        if ($wrapper == '') {
            $filter_data = $data;
        } else {
            $filter_data = $data[$wrapper] ?? [];
        }


        foreach($this->filters as $key=>$scope) {

            if(isset($filter_data[$key])) {

                // eager load for performance?
                if(isset($this->filter_additional[$key]) && count($this->filter_additional[$key]) > 0) {
                    $args = [];
                    foreach($this->filter_additional[$key] as $fld) {
                        $args[] = $filter_data[$fld];
                    }
                    $query->$scope($filter_data[$key], ...$args);
                } else { 
                    if($scope) {
                        $query->$scope($filter_data[$key]);
                    } else {
                        // Attempt a simple filter on the column property:
                        // (but only if the column exists - protects against injection)
                        if(in_array($key, Schema::getColumnListing($query->getModel()->getTable()))) {
                            $query->whereRaw($key . ' like ?', '%' . $filter_data[$key] . '%');
                        }
                    }
                }
                
            }
        }


        if($filtersOnly) {
            return $query;
        }
        

        /** APPLY SORTERS */
        // does this need to police only one sorter?
        if(isset($data[$this->sorter_field]) || $this->default_sort) {

            // dd($data[$this->sorter_field]);

            $sorts = $data[$this->sorter_field] ?? $this->default_sort;

            if(!is_array($sorts)) {
                $sorts = [$sorts];
            }

            // dd($sorts);

            foreach($sorts as $key=>$sort) {

                // dump($key);
                // dump($sort);

                // sort may be a single string with prop & direction
                if(is_numeric($key)) { //\str_contains($sort, '_')) {
                    $split = explode('_', $sort);
                    $prop = $split[0];
                    $dir = $split[1] ?? 'asc';
                } else {
                    // or, it maybe an array of [$prop]=>$dir
                    $prop = $key;
                    $dir = $sort;
                }

                // dump($prop);
                // dd($this->sorters);

                // if(isset($this->sorters[$prop]) && ($dir == 'asc' || $dir == 'desc')) {
                if(array_key_exists($prop, $this->sorters) && ($dir == 'asc' || $dir == 'desc')) {

                    $scope = $this->sorters[$prop];    

                    if(!is_null($scope)) {
                        if($scope instanceof \Closure) {
                            $query = $scope($query, $dir);
                            // dd($query->toSql());
                        } else {
                            $query->$scope($dir);
                        }
                    } else {

                        // if the sorter is null? Attempt a simple sort on the column property:
                        // (but only if the column exists - protects against injection)
                        if( in_array($prop, Schema::getColumnListing($query->getModel()->getTable()))) {
                            $query
                                ->orderBy(DB::Raw('if( ' . $prop . ' is null or ' . $prop . ' = "", 1, 0)')) // ignore nulls
                                ->orderBy($prop, $dir);
                        }
                       
                    }


                } else {

                    // TODO - fix the logic here so we're noot dupllicating the code above, but also
                    // need to correctly handle direction values (which may be unset here)


                    if( in_array($prop, Schema::getColumnListing($query->getModel()->getTable()))) {

                        if(Schema::getColumnType($query->getModel()->getTable(), $prop) == 'datetime') {
                             
                            $query
                                ->orderBy(DB::Raw('if( ' . $prop . ' is null, 1, 0)')) // ignore nulls
                                ->orderBy($prop, $dir);

                        } else {

                            // $query
                            //     ->orderBy(DB::Raw('if( ' . $prop . ' is null or ' . $prop . ' = "", 1, 0)')) // ignore nulls
                            //     ->orderBy($prop, $dir);

                        }

                       
                    }
                }

            }
            // out of sorts.

        }

        return $query;

    }


    static function getPageVariable() {
        $fm = static::getInstance();
        return $fm->page_variable;
    }


    static function getPage($data=[], $page=1) {

        $fm = static::getInstance();

        $q = $fm->apply($data);

        // dump($page);

        if($fm->pagesize > 0) {
            $items = $q->paginate($fm->pagesize, ['*'], $fm->page_variable, $page ?? 1);
        } else {
            $items = $q->get();
        }

        return $items;
    
    }


    static function get($data=[]) {
        
        $fm = static::getInstance();

        $q = $fm->apply($data);

        return $q->get();
        
    }


    // Function to return previous and next models to the supplied model
    // - $data = the filter data to apply
    // - $model = the current model / context (i.e. the model currently being viewed)
    // - $loop - whether the next/prev models are allowed to loop around the ends of the collection (To Be Implemented)
    static function getAdjacentModels($data=null, $model, $loop=false) {

        $out = [
            'prev'=>null,
            'next'=>null
        ];

        $items = static::get($data);
        $ids = $items->modelKeys();

        $idx = array_search($model->id, $ids);

        if($idx !== false) {
            if($idx > 0) {
                $out['prev'] = $items[$idx-1];
            }
            if($idx < count($ids)-1) {
                $out['next'] = $items[$idx + 1];
            }
        }
    
        return $out;

    }


    static public function getInstance(){
        $class = get_called_class();
        if(!isset(self::$instances[$class])){
            self::$instances[$class] = new $class();
        }
        return self::$instances[$class];
    }


    public function addRoute($key, $route) {
        $this->routes[$key] = $route;
        return $this;
    }

    public function getRoute($key) {
        return $this->routes[$key];
    }

    public function getRouteUri($key) {
        if(isset($this->routes[$key])) {
            return '/' . $this->routes[$key]->uri;
        }
    }

    public function getRouteUris() {
        $uris = [];
        foreach($this->routes as $key => $route) {
            $uris[$key] = '/' . $route->uri;
        }
        return $uris;
    }

}
