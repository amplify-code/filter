<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterPage extends Component
{

    public $pageSize = 24;
    public $tag;

    public $filterManager;
    public $items;

    public $filters;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($pageSize=24, $tag='div', $filterManager=null) {

        $this->pageSize = $pageSize;
        $this->tag = $tag;

        if($filterManager) {
            $this->filterManager = $filterManager;
            $page_var = $this->filterManager::getPageVariable();
            $this->items = $this->filterManager::getPage(request()->all(), request()->$page_var);

            $query_vars = [];
            foreach($filterManager::getInstance()->getFieldNames() as $fld) {
                $query_vars[$fld] = request()->$fld;
            }
            $this->filters = $query_vars;
        }

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::page');
    }
}
