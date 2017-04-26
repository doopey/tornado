# -.- coding:utf8 -.-

from tornado.web import StaticFileHandler
from tornado.web import Application
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.options import define, options
from tornado.web import RequestHandler
import os.path


class WordUpdateHandler(RequestHandler):
    def get(self):
        self.render(
            'wordUpdate.html'
        )

class App(Application):
    def __init__(self):
        settings = {
            "template_path": os.path.join(os.path.dirname(__file__), "template"),
            "static_path": os.path.join(os.path.dirname(__file__), "static"),
            "upload_path": os.path.join(os.path.dirname(__file__), "upload")
        }
        handlers = [(r"/(favicon.ico)", StaticFileHandler, {"path": settings["static_path"]}),
                (r"/wordUpdate", WordUpdateHandler)],



application = Application(
    handlers = [
                (r"/wordUpdate", WordUpdateHandler)],
    template_path = os.path.join(os.path.dirname(__file__), "templates"),
    static_path = os.path.join(os.path.dirname(__file__), "static")
)



if __name__ == "__main__":
#    application.listen(8888)
#    IOLoop.instance().start()
    httpsvr = HTTPServer(application)
    httpsvr.listen(8888)
    IOLoop.current().start()

