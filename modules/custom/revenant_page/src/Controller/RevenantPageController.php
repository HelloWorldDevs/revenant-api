<?php
/**
 * @file
 * Contains \Drupal\revenant_page\Controller\RevenantPageController.
 */

namespace Drupal\revenant_page\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

use Drupal\node\Entity\Node;

class RevenantPageController extends ControllerBase {

    /**
     * Callback for `my-api/get.json` API method.
     */
    public function get_example( Request $request ) {

        $response['data'] = 'Some test data to return';
        $response['method'] = 'GET';

        return new JsonResponse( $response );
    }

    public function post_example( Request $request ) {

        // This condition checks the `Content-type` and makes sure to
        // decode JSON string from the request body into array.
        if ( 0 === strpos( $request->headers->get( 'Content-Type' ), 'application/json' ) ) {
            $data = json_decode( $request->getContent(), TRUE );
            $request->request->replace( is_array( $data ) ? $data : [] );
        }

        $node = Node::create(array(
            'type' => 'revenant_page',
            'title' => 'NEW PAGE!',
            'langcode' => 'en',
            'uid' => '1',
            'status' => 1,
            'field_page_url' => 'asdfs/asdfa/asdf',
        ));

        $node->save();

        $response['data'] = 'Some test data to return';
        $response['method'] = 'POST';

        return new JsonResponse( $response );
    }


}