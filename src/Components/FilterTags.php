<?php

namespace AmplifyCode\Filter\Components;

use Illuminate\View\Component;

class FilterTags extends Component
{

    public $filterName = null;
    public $source = null;
    public $title = null;
    public $labelField = null;
    public $idField = null;
    public $value = [];

    public $model = null;
    public $valueModels = '';
    public $join = 'any';
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($filterName, $source, $model, $title, $value=[], $labelField='title', $idField='id') {
    
        $this->filterName = $filterName;
        $this->source = $source;
        $this->title = $title;
        $this->labelField = $labelField;
        $this->idField = $idField;
        $this->value = $value ?? [];

        if(isset($value['join'])) {
            $this->join = $value['join'];
            unset($value['join']);
        }

        $this->model = $model;

        // dd($model);

        $qSel = $model::query();
        $this->valueModels = $qSel->findMany($value);
        // foreach($sel as $val) {
        //     // $this->valueTags .= '<div class="badge badge-primary">' . $val->$labelField . '<input type="hidden"<a href="#" style="color: white; font-weight: 600"><i class="bi-x"> </i></a></div>';
        // }
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|string
     */
    public function render()
    {
        return view('filter::tags');
    }
}
