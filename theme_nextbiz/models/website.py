# -*- coding: utf-8 -*-
# Part of Odoo Module Developed by Bizople Solutions Pvt. Ltd.
# See LICENSE file for full copyright and licensing details.


from odoo import api, fields, models
from odoo.http import request
import base64

# class ResLang(models.Model):
#     _inherit = 'res.lang'

#     lang_flag = fields.Binary(string='Language Flag')
    
class res_config(models.TransientModel):
    _inherit = "res.config.settings"

    login_page_banner_image = fields.Binary(string='Login Banner Image', related='website_id.login_page_banner_image', readonly=False)
    transparent_header_logo = fields.Binary(string='Transparent Header Logo', related='website_id.transparent_header_logo', readonly=False)
    sidebar_logo = fields.Binary(string='Sidebar Menu Logo', related='website_id.sidebar_logo', readonly=False)

class Website(models.Model):
    _inherit = "website"
        
    login_page_banner_image = fields.Binary('Login Page Banner Image', readonly=False)
    transparent_header_logo = fields.Binary('Transparent Header Logo', readonly=False)
    sidebar_logo = fields.Binary('Sidebar Menu Logo', readonly=False)