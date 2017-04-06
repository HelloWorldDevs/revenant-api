CKEDITOR.plugins.add( 'rev-image-upload', {
    requires: 'widget',

    icons: 'image',

    init: function( editor ) {
        editor.widgets.add( 'image', {
            button: 'Upload and Image'
        } );
    }
} );