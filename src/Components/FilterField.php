<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterField extends Component
{

    public $filterName = null;
    public $query = null;
    public $title = null;
    public $labelField = null;
    public $idField = null;
    public $value = [];
    public $component;

    public $model;
    public $optionScopes;
    public $relation;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($filterName, $relation=null, $model=null, $optionScopes=[], $query=null, $title=null, $value=[], $labelField='title', $idField='id') {
    
        $this->filterName = $filterName;
        $this->query = $query;
        $this->title = $title;
        $this->labelField = $labelField;
        $this->idField = $idField;
        $this->value = $value ?? [];

        $this->component = $this;

        $this->model = $model;
        $this->optionScopes = $optionScopes;
        $this->relation = $relation;





        
        
        // $this->query = ($model)::$scope();

    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::field');
    }
}
