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

    public function post_page( Request $request ) {

        // This condition checks the `Content-type` and makes sure to
        // decode JSON string from the request body into array.
        if ( 0 === strpos( $request->headers->get( 'Content-Type' ), 'application/json' ) ) {
            $data = json_decode( $request->getContent(), TRUE );
            $request->request->replace( is_array( $data ) ? $data : [] );
        }
        $content = json_decode($request->getContent(), TRUE);

        //create node for page on check
        $page_node = Node::create(array(
            'type' => 'revenant_page',
            'title' => $content['title'],
            'langcode' => 'en',
            'uid' => '1',
            'status' => 1,
            'field_page_url' => $content['url'],
        ));
        $page_node->save();
        $page_node_id = $page_node->id();

        // create default content node for page
        $content_node = Node::create(array(
            'type' => 'revenant_content_item',
            'title' => 'default content item',
            'langcode' => 'en',
            'uid' => '1',
            'status' => 1,
            'body' => 'default content item',
            'field_new_content' => 'default content item',
            'field_xpath' => 'default content item',
        ));
        $content_node->field_page->target_id = $page_node_id;
        $content_node->save();

        $response['data'] = 'Some newer test data to return';
        $response['method'] = 'POST';


        return new JsonResponse( $response );
    }

}