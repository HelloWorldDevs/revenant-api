<?php
/**
 * @file
 * Contains \Drupal\revenant_page\Controller\RevenantPageController.
 */

namespace Drupal\revenant_page\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class RevenantPageController extends ControllerBase {

    /**
     * Callback for `my-api/get.json` API method.
     */
    public function get_example( Request $request ) {

        $response['data'] = 'Some test data to return';
        $response['method'] = 'GET';

        return new JsonResponse( $response );
    }


}