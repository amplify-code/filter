<?php
namespace AmplifyCode\Filter\DataTable;

class Column {

    public $sortable = false;
    public $sortBy = '';
    public $sortQuery = null;

    public $sorted = '';

    public $copyable = false;
    public $exportable = true;


    public $filter = null;
    public $filterScope = null;
    public $filterable = false;
    public $filterBlade = '';
    public $filterOpts = '';
    public $filterBladeProps = [];


    public $title = '';
    public $slug = '';
    public $titleBlade = null;

    public $value = '';
    
    public $isBlade = false;
    public $bladeProps;

    public $isLink = false;
    public $linkAction='edit';
    public $linkParam='';
    public $link = null;

    public $align = '';

    public $width = ''; //'1fr'; //null;
    public $noWrap = false;
    public $titleSpan = 1;
    public $showTitle = true;

    static function make($title = null, $value = null) {
        $col = new Column();
        if ($title) {
            $col->title($title);
        }
        if ($value)  {
            $col->valueProperty($value);
        }
        return $col;
    }

    public function width($val) {
        $this->width = $val;
        return $this;
    }

    public function noWrap($val=true) {
        $this->noWrap = $val;
        return $this;
    }

    public function title($val) {
        $this->title = $val;
        $this->slug = \Illuminate\Support\Str::slug($val);
        return $this;
    }

    public function titleBlade($blade) {
        $this->titleBlade = $blade;
        return $this;
    }

    public function titleSpan($span) {
        $this->titleSpan = $span;
        return $this;
    }

    public function showTitle($bool) {
        $this->showTitle = $bool;
        return $this;
    }

  
    public function link($link) {
        $this->isLink = true;
        $this->linkAction = $link;
        return $this;
    }

    public function value($val, $isLink=false) {
        $this->value = $val;
        $this->isLink = $isLink;
        return $this;
    }

    public function valueProperty($val, $isLink=false) {
        $this->value = function ($item) use ($val) {
            return $item->$val;
        };
        $this->isLink = $isLink;
        return $this;
    }

    public function valueRelationshipProperty($rel, $prop, $isLink=false) {
        $this->value = function ($item) use ($rel, $prop) {

            $ary = explode('.', $rel);

            foreach($ary as $rel) {
                if($item->$rel) {
                $item = $item->$rel;
                } else {
                    return ''; //"bailed at " . $rel;
                }
            }

            return $item->$prop ?? '';
        };
        $this->isLink = $isLink;
        return $this;
    }

    public function valueCount($prop) {
        $this->value = function($item) use ($prop) {
            // dd($item->$prop);

            \Log::info('** ' . $prop . ' **');
            $prop = $prop . '_count';
            return $item->$prop; 
        };
        // should also add this to the withCount for the view?
        return $this;
    
    }

    public function valueSum($rel, $prop) {
        $this->value = function($item) use ($rel, $prop) {
            // dd($item->$prop);
            return $item->$rel->sum($prop); 
        };
        // should also add this to the withCount for the view?
        return $this;
    
    }

    public function copyable($bool=true) {
        $this->copyable = $bool;
        return $this;
    }

    public function exportable($bool=true) {
        $this->exportable = $bool;
        return $this;
    }

    public function valueBlade($blade, $props=[]) {
        $this->isBlade = true;
        $this->value = $blade;
        $this->bladeProps = $props;
        return $this;
    }

    public function align($align) {
        $this->align = $align;
        return $this;
    }

    public function sortable($bool=true) {
        $this->sortable = $bool;
        return $this;
    }

    public function sortScope($scope) {
        $this->sortable();
        // $this->sortQuery = function ($q, $dir='asc') use ($scope) {
        //     return $q->$scope($dir);
        // };
        $this->sortQuery = $scope;
        return $this;
    }

    public function sortableBy($prop) {
        $this->sortable();
        $this->sortQuery = function ($q, $dir='asc') use ($prop) {
            return $q->orderby($prop, $dir);
        };
        return $this;
    }

    public function sortableBySum($relation, $prop) {
        $this->sortable();
        $this->sortQuery = function ($q, $dir='asc') use ($relation, $prop) {
            return $q->withSum($relation, $prop)->orderby($relation . '_sum_' . $prop, $dir);
        };
        return $this;
    }

    public function sortableByCount($prop) {
        $this->sortable();
        $this->sortQuery = function ($q, $dir='asc') use ($prop) {
            return $q->orderby($prop, $dir);
        };
        return $this;
    }

    public function sortableByQuery(\Closure $query) {
        $this->sortable();
        $this->sortQuery = $query;
        return $this;
    }

    public function buildSortUrl() {

        $url = url()->current();
        $query = request()->query();

        unset($query['sort']);

        switch($this->getSortDirection()) {
            case 'asc':
                $dir = 'desc';
                break;

            case 'desc':
                $dir = '';
                break;

            default:
                $dir = 'asc';
                break;
        }        

        if ($dir) {
            $query['sort'][$this->slug] = $dir;
        }

        return $url . (count($query) > 0 ? ('?' . http_build_query($query)) : '');
        
    }

    public function getSortDirection() {

        if (isset(request()->sort[$this->slug])) {
            return request()->sort[$this->slug];
        }

    }

    /* filtering */
    public function filter($filter) {
        $this->filterable = true;
        $this->filter = $filter;
        return $this;
    }    

    public function filterable($bool=true) {
        $this->filterable = $bool;
        return $this;
    }


    public function filterScope($scope) { 
        $this->filterable = true;
        $this->filterScope = $scope;
        return $this;
    }

    public function filterBlade($blade, $opts=null, $props=[]) {
        $this->filterBlade = $blade;
        $this->filterOpts = $opts;
        $this->filterBladeProps = $props;
        return $this;
    }

    // merges a few attributes togther for use in the filter blade
    public function getFilterBladeParameters() {

        $params = [
            'name' => $this->slug,
            'opts' => $this->filterOpts
        ];

        $params = array_merge($params, $this->filterBladeProps);

        return $params;

    }

    public function buildClearFilterUrl() {

        $url = url()->current();
        $query = request()->query();

        unset($query['cfilter'][$this->slug]);

        return $url . (count($query) > 0 ? ('?' . http_build_query($query)) : '');
        
    }


}
