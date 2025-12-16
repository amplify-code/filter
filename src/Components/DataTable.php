<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

use AmplifyCode\Filter\DataTableBuilder;

class DataTable extends Component
{

    public $pageSize = 24;
    public $builder;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct() { //DataTableBuilder $builder, $pageSize=24) {

        // $this->pageSize = $pageSize;
        // $this->builder = $builder;

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::datatable');
    }
}
