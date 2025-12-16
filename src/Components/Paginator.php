<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class Paginator extends Component
{

    public $blade;
    public $filterManager;
    public $items;

    // public $filterManager;
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($blade='default', $filterManager=null) {

        $this->blade = 'filter::pagination.default';
        if(view()->exists($blade)) {
            $this->blade = $blade;
        } else if(view()->exists('filter::pagination.' . $blade)) {
            $this->blade = 'filter::pagination.' . $blade;
        }

        if($filterManager) {
            $this->filterManager = $filterManager;
            $this->items = $this->filterManager::getPage(request()->all(), request()->{$filterManager::getPageVariable()});
        }

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render() {
        return view('filter::paginator');
    }
}
